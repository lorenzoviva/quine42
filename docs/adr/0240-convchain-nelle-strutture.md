# ADR-0240 — `convchain` nelle strutture: il campione nel nodo, strato per strato

Data: 2026-11-21 · Stato: accettato (task T469 del backlog, S3 di T458, step 44) · Riferimenti: ADR-0174 (`wfc`, `convchain`, la `map`
frazionaria), ADR-0176 (i tetti del mondo), ADR-0178 (la griglia a pezzi), ADR-0183 (lo Scultore delle strutture senza scheletro), ADR-0142 (il
motore non cambia un voxel), ADR-0239 (lo Scultore a specialità), lo studio [`docs/design/scultori-specializzati.md`](../design/scultori-specializzati.md) § 5

## Contesto

L'autore (21/11, T469) vuole che l'Architetto sappia anche la WFC, per i selciati, le mura irregolari, i campi. Nel motore di oggi `<wfc>` e
`<convchain>` non possono stare in un programma dello Scultore, come avevano già visto T337 e il metodo (`lab/banco/metodo/README.md`):

- leggono tessere e campioni da file di `models/`, che lo Scultore non scrive (scrive un XML solo, ADR-0176 § 5) e che il seme non ha;
- `convchain` e la `wfc` a sovrapposizione girano solo su una griglia piana, come nell'originale, e la scatola di una struttura è sempre di
  più strati (80, 120, 160 voxel di altezza): nessuna `map` la porta a uno strato a tutte le taglie (i denominatori arrivano a 32 e 160 è
  il doppio di 80, quindi un fattore che dà uno strato a 80 ne dà due a 160);
- la `wfc` a tessere fa una griglia nuova con le sue tessere, quindi decide la scatola, e nel mondo la sua onda sta su 32 768 celle (il
  piano a un quinto di una Gargantuesca ne ha 1,6 milioni); quella a sovrapposizione riscrive ogni cella della griglia.

## Decisione

1. **Il campione nel nodo.** `<convchain>` prende il campione da `models/<nome>.txt` (`sample="x"`, come prima) o dal testo del figlio
   `<sample>`: righe separate da `/`, anche andando a capo, nelle due lettere `black` e `white`; uno dei due modi, mai entrambi. Il
   compilatore lo legge come un pattern (`block`, uno strato solo); `mjxIncludes` non chiede file.
2. **Strato per strato.** Su una griglia di più strati ogni strato che ha celle `on` è una griglia piana a sé: le stesse finestre N×N, che
   girano attorno ai bordi dello strato come nell'originale girano attorno a quelli della griglia, gli strati passati dal basso, ognuno con
   tante estrazioni quante sono le sue celle (`ConvChainRunner.sweep`). Su una griglia piana è la stessa corsa di prima, voxel per voxel e
   passo per passo: le impronte di ChainDungeon e ChainDungeonMaze in `tests/mj-wfc.test.ts` sono state prese col motore di prima.
3. **I tetti.** Una passata visita le celle degli strati che hanno celle `on`. Nel mondo al più **65 536** (`WORLD_NODE_LIMITS.convchainCells`,
   controllato dalla corsa come l'onda, prima di estrarre: sotto non cambia niente): il piano di ogni taglia, il pavimento di una Grande o
   di una Enorme, un pezzo con il suo margine; non la piena scala di una Gargantuesca (250 000). Nel motore al più 2^20 su una griglia di più
   strati (`WFC_LIMITS.convchainCells`; la griglia piana dell'originale non ha tetti nuovi). Una passata costa circa 225 operazioni per cella
   della trama a `n` 3: i 50 passi che il mondo concede stanno in un paio di secondi.
4. **La `wfc` resta com'è.** Il prompt dell'Architetto la nomina per ciò che non è: una griglia di tessere che decide la scatola, non uno
   strumento per una struttura.
5. Kernel **0.10.17** (sale `Z`: un programma che girava dà la stessa griglia; ciò che era un errore, una `convchain` su più strati o senza
   file, ora gira).

## Conseguenze

- L'Architetto ha una trama: un cortile lastricato a macchie, i solchi di un campo, un bordo ruvido, sul piano a un quinto a ogni taglia, o
  su un pavimento a piena scala di una Grande o di una Enorme (`lab/banco/taglie/scultore-rocca-ciclo.xml`, il cortile della rocca).
- Le carte fatte a mano possono usare `convchain` col campione nel nodo, entro gli stessi tetti del mondo (prima no: una carta non legge
  file). Sicurezza: nessuna superficie nuova, un nodo che c'era entro i tetti in unità, con un tetto in più.
- Ci si scosta dall'originale in un punto in più (ADR-0174 § 5): là una `convchain` su una griglia di più strati è un errore.
- Alternative scartate: (a) campioni del seme come file di `models/`: restano piani, e la sezione dei file del nucleo con l'elenco andrebbe
  a ogni richiesta di ogni mestiere; (b) la `wfc` a sovrapposizione strato per strato: riscrive ogni cella, non fa una trama su una parte;
  (c) una `map` che porti la struttura a uno strato: non esiste a tutte le taglie; (d) lasciare tutto com'è e dire all'Architetto che non
  può: l'autore li vuole, e T337 l'aveva già detto senza rimedio.
