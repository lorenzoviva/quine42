# ADR-0128 — Lo sviluppo si divide in quattro fasi e in step, cioè obiettivi condivisi tra task

Data: 2026-11-04 · Stato: accettato · Riferimenti: ADR-0072 (la pipeline), ADR-0117 (il glossario), T230, T231

## Contesto

L'autore (to-do del 04/11, «Fasi dello sviluppo») vuole due parole nuove. Le **fasi** sono quattro: il kernel 0.9.0, i beta tester, il kernel 1.0.0, la produzione pubblica; possono cambiare in corso d'opera. Lo **step** non è più una tappa del piano ma il raggiungimento di un obiettivo condiviso tra task, con la numerazione che continua dai nove già fatti e il pregresso riassegnato agli obiettivi raggiunti. Vuole poter dire all'orchestratore quale step priorizzare. Oggi il backlog ha quasi trecento task in ordine di nascita, e nessun modo per dire a che cosa servano insieme.

## Decisione

- **`docs/fasi.md` è il documento delle fasi e degli step**: le quattro fasi, ciò che l'autore ne ha detto, il criterio per dirle finite (quello della Fase I è una proposta che aspetta la sua approvazione), e la tabella `| step | obiettivo | fase | stato | task |`.
- **La tabella dice quali task stanno in ogni step; ogni task sta in una sola riga.** Chi pianifica un task che serve a uno step lo scrive lì nello stesso commit. Il tag `- Step:` nel backlog è una copia per la pipeline, messa da T231 leggendo la tabella: il backlog non lo tocca chi esegue un task.
- **Un numero non cambia mai**, e uno step nuovo prende il primo libero qualunque sia la sua fase: la numerazione non è un calendario. Così «priorizza lo step 31» vale anche fra un mese. Una fase può cambiare, il numero no.
- **Gli step da 1 a 9 restano quelli**, riletti come obiettivi; da 10 a 27 è il lavoro già fatto dal backlog, da 28 in poi quello aperto. Il suono è lo step 25, come nell'esempio dell'autore: gli obiettivi raggiunti in mezzo sono stati raccolti in modo che lo fosse, e due arrivati prima o insieme (l'Attore, la solidità) hanno un numero più alto.
- **Fase e Step entrano nel glossario**, con i loro omonimi: `step` e `phase` nel codice oggi vogliono dire altro.

## Alternative scartate

- **Il tag solo nel backlog, senza tabella**: l'obiettivo di uno step non avrebbe un posto dove stare, e l'autore non vedrebbe il quadro senza un comando.
- **Rinumerare da 1 gli obiettivi, in ordine di tempo, togliendo i nove di prima**: l'autore vuole restare sulla stessa numerazione, e gli ADR citano «step 9».
- **Un test che controlla che ogni task sia nella tabella**: un task nuovo può non avere step (T231), e il test diventerebbe rosso a ogni pianificazione. La copertura si è controllata una volta, sull'indice, consegnando T230.
- **Righe per la beta stessa e per i requisiti del kernel 1.0.0**: non hanno ancora task. Uno step si apre quando li ha.

## Conseguenze

- `docs/plans/backlog.md` ha due blocchi con l'id `T59`. La tabella ne ha uno solo, nello step 16, e lo dice; il secondo (l'editor del laboratorio) è un obiettivo dello step 23. Un comando che mette i tag per id tratta i due blocchi allo stesso modo.
- La colonna `stato` si aggiorna a mano; può restare indietro rispetto al backlog finché qualcuno non la derivi dai task.
- `package.json` dice `0.1.0`: il criterio proposto della Fase I lo porta a `0.9.0`.
