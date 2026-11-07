# ADR-0173 — L'inferenza di MarkovJunior nel motore: `field`, `temperature`, `observe`, `search`

Data: 2026-11-07 · Stato: accettato (task T334 del backlog, step 30) · Riferimenti: l'autore in chat (07/11, punto 1), `lab/banco/pattern.md` §12, ADR-0036 e ADR-0038 (MarkovJunior nel gioco e nel laboratorio), ADR-0105 (i limiti della sandbox), ADR-0118 (la traccia), ADR-0136 (la versione del kernel), ADR-0142 (il motore si ottimizza solo voxel per voxel identico); il sorgente di MarkovJunior (github.com/mxgmn/MarkovJunior, MIT): `Field.cs`, `Observation.cs`, `Search.cs`, `RuleNode.cs`, `OneNode.cs`, `AllNode.cs`, `ParallelNode.cs`

## Contesto

I casi più belli del repository di MarkovJunior non giravano sul banco: il motore (`src/mj/engine.ts`) non aveva i campi di potenziale e la
temperatura (`Keys`, `SoftPath`, `Division`, `Dwarves`, `GrowTo`) né le osservazioni e la ricerca (`StairsPath`, `RegularPath`,
`CompleteSAW`, i Sokoban). Il compilatore rifiutava `<field>` e `<observe>`. Il motore è lo stesso del gioco: i programmi di oggi non
devono cambiare di un voxel (ADR-0142), e ciò che si aggiunge deve avere tetti, perché la ricerca dell'originale non ne ha.

## Decisione

1. **Come nell'originale, in tre dimensioni** (`src/mj/infer.ts`, funzioni pure su array): il campo di un codice è la distanza in sei
   vicini, sulle celle `on`, dalla cella `to` più vicina (`from`: rovesciato, il nodo se ne allontana), -1 dove non arriva; l'euristica di una
   corrispondenza è la somma, sulle celle che scrive con un codice che il suo ingresso non accetta, del potenziale nuovo meno il vecchio (con
   le correzioni dei campi rovesciati), nulla se un potenziale nuovo è -1 (`DeltaPointwise`). Le osservazioni fanno della griglia un presente
   e un futuro (`value` diventa subito `from`, alla fine deve essere uno di `to`), i potenziali propagano le regole all'indietro dal futuro;
   la ricerca è il best-first dell'originale (stime avanti e indietro, `depthCoefficient`, sotto 0 prima in profondità; `limit`: venti
   tentativi), con gli stati figli di `all` come insiemi massimali di corrispondenze che non si sovrappongono.

2. **Un runner a parte, solo per chi inferisce** (`GuidedRunner`, sottoclasse di `RuleRunner`): un nodo `one`, `all` o `prl` con almeno un
   `field` o un `observe`. Lì una corrispondenza è dovunque l'ingresso combacia, anche se non cambierebbe niente, come nell'originale (una
   regola `U→U` compete con `U→A`); `one` prende la chiave migliore (a temperatura 0 `-h` più un millesimo di estrazione, sopra
   `u^exp((h-h₀)/T)`: probabilità ∝ `exp(-h/T)`), `all` applica in ordine di chiave dove non si sovrappone, `prl` aspetta solo i suoi campi.
   Con le osservazioni `one` si ferma quando la griglia è nel futuro; con una traiettoria la rigioca, uno stato a passo. Ogni altro nodo resta
   il `RuleRunner` di sempre: il test di ADR-0142 (`tests/mj-engine-determinism.test.ts`) non cambia. `temperature` da sola, come
   nell'originale, non fa niente (il compilatore lo avvisa).

3. **Dove si scosta dall'originale, e perché.** (a) Le corrispondenze sono sempre quelle della griglia di adesso: l'originale, in un `all` con
   i campi, perde fino a quando il nodo ricomincia quelle che in un passo non hanno potenziale (resta segnata la loro maschera). (b) Un `all`
   che non applica niente si ferma subito; l'originale conta un passo vuoto e si ferma al successivo. (c) L'originale ignora una chiave sotto
   -1000 e, nella ricerca, un potenziale da 1000 in su; qui no. (d) `ParallelNode` dell'originale calcola potenziali e ricerca che non usa:
   qui un `prl` calcola solo i campi e cambia le celle osservate. (e) La ricerca dell'originale è in 2D (le sue `Matches` e `Applied`
   ignorano z): qui è in 3D. (f) Il futuro di una cella è un insieme di 32 bit, come nell'originale: con più di 32 codici `observe` è un
   errore del programma.

4. **I tetti** (`INFERENCE_LIMITS`): la ricerca tiene al più **100 000 stati** (o `limit`, se è minore) e **64 MB** di stati, e da uno stato
   enumera al più **4096 figli**: oltre, non trova, e il nodo fa ciò che fa l'originale quando la ricerca torna nulla (sceglie a caso). Questi
   tetti contano unità, non tempo: lo stesso seme trova la stessa traiettoria, o nessuna, su ogni macchina. Il tempo è un tetto a parte, di
   **10 s** per ricerca e comunque entro la scadenza della corsa: chi lo supera ferma la corsa, che **non è finita** (`finished: false`, come
   una corsa lenta): mai un esito diverso per una macchina più lenta. I potenziali di un nodo (codici × celle × 4 byte, il doppio con la
   ricerca, più un bit per regola e cella) stanno sotto **128 MB**, se no è un errore del programma.

5. **Il gioco non li prende ancora**: il validatore (`modelErrors`) e le carte fatte a mano (`handmadeProgramErrors`) rifiutano un programma
   con `<field>` o `<observe>` (`inferenceRefusal`, `inferenceIn`), con il motivo. Li apre T336, con i suoi tetti e il prompt dello Scultore.

6. **Il laboratorio**: la traccia (`src/mj/trace.ts`) scrive ciò che un nodo inferisce (`campo R da G su RDA`, `temperatura=2`,
   `osserva G→B fino a R`, `ricerca`) e ciò che la ricerca ha trovato (`ricerca: traiettoria di 80 passi, 385 stati`, o perché no);
   l'editor colora `field`, `observe` e i loro attributi, li suggerisce e non li prende per regole da disegnare. In `lab/mjx/official/`
   Keys, SoftPath, StairsPath (senza il `map` finale, a tessere da file), e in 2D Dwarves, Division, RegularPath, GrowTo, CompleteSAW, alle
   taglie di `models.xml`; le foto in `lab/banco/inferenza/`, accanto a quelle della griglia che dà l'originale in C#, eseguito con un
   `Program.cs` senza immagini (`lab/banco/inferenza/originale/`).

## Conseguenze

- Il confronto con l'originale è nei test dove l'esito non dipende dal caso (Dwarves, GrowTo, CompleteSAW, il reticolo di Keys: gli stessi
  conteggi) e nelle foto dove ne dipende.
- `src/mj/` è del kernel: il kernel sale a **0.5.8** (Z, ADR-0136; 0.5.7 era già di ADR-0171, T333, integrato prima). Il contratto con gli universi non cambia.
- Sicurezza: nessuna superficie nuova verso i client; i programmi del mondo non arrivano ancora all'inferenza (punto 5); i tetti del punto 4
  sono ciò che T336 dovrà tenere quando la apre.
