# Le domande aperte per l'autore

L'elenco unico (richiesta dell'autore, 04/11): l'orchestratore lo tiene aggiornato e lo riporta in chat. I numeri non cambiano; una risposta toglie la riga.

- **D33 (T258 — Come fare posto nel tempo a Enorme per le strutture con cantina, 120×120×112, `docs/pipeline/domande/T258.md`):** la lettera del suolo (`suolo="E"`, ADR-0135) funziona e la cantina scritta a mano (`lab/banco/riferimento/cantina.xml`) regge 12 semi su 12 alle due taglie in 6,8 s, ma lo scheletro con la cantina usa già 6,8 s degli 8 concessi; la locanda del modello fa 0 su 4 richieste (4/5 semi a Grande nelle seconde richieste, 0/5 a Enorme perché supera gli 8 s e viene troncata; `locanda/1/seconda` senza limite passa 5/5 a Enorme in 7,3–7,8 s; perimetro a Grande 0,04–0,05 contro 0,15, correggibile nel prompt).
  - **A (Raccomandata):** un task che profila e accelera il motore (`src/mj/engine.ts`) sui passi ripetuti lasciando i modelli identici voxel per voxel, poi riprova la locanda (al più 2 richieste, `--insieme 1`) con il ritocco del prompt per il perimetro a Grande. Serve anche ad altre strutture grandi (es. `pagoda/1`, già a 6–7 s) e al gioco, senza abbassare soglie.
  - **B:** dare alle strutture con cantina (`sotto`) un tempo proprio (la voce `tempo` dell'indice esiste già fino a 30 s, es. 16 s), più il ritocco del prompt per il perimetro a Grande. Più economico, ma è una deroga agli 8 s e il mondo aspetta di più quel modello.
  - **C:** provare e validare le strutture con cantina a una taglia sola (Grande), lasciando la locanda fuori dalla soglia a due taglie di T180.

## Rimandate per tua scelta
T45f a fine Fase I (progetto GCP, hosting, regione); T93 in Fase IV (Managed Payments).
