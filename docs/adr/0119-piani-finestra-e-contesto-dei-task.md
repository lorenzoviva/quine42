# ADR-0119 — La pipeline: piani di abbonamento, finestra delle 5 ore, nessun ripiego, contesto dei task

Data: 2026-11-03 · Stato: accettato · Riferimenti: ADR-0072 (la pipeline), ADR-0079 (l'ambiente dell'orchestratore), ADR-0087 (tetti e slot), ADR-0088 (i turni), ADR-0115 (Fable). Il numero 0118 è riservato all'ADR di T179.

## Contesto

La pipeline consumava più del necessario e si fermava male:

- `fits` guardava la settimana e la soglia del 10 %: un task partiva con la sessione al 12-15 %, moriva sul limite a metà e perdeva la cache del prompt. Per evitarlo l'orchestratore toglieva `· approvato` ai task, facendo a mano da cancello.
- Il ripiego automatico (`alternative`) dirottava task complessi su modelli meno capaci.
- Ogni agente caricava il backlog intero (~35 mila token) e ne modificava il blocco: conflitti di merge frequenti, come quelli sul numero degli ADR, ciascuno con un task «Integrare Txx» da pagare.
- `quadro.md` era diventato un diario di 229 righe, letto a ogni epoca, e ogni epoca costava un turno di chiusura.
- Passare da Pro a Max 5x richiedeva di ripensare tutte le stime a mano.

## Decisione

1. **Piani.** `abbonamenti` dice il piano attivo, `piani` il suo `moltiplicatoreStima` e i provider `disponibili`; ogni provider ha `abbonamento`, `orchestrabile` e `ratioSessioneSettimana`. Le stime del backlog restano scritte sul piano di riferimento (Max 5x, Ultra); si scalano quando si usano (`scaledEstimate`). Un provider fuori dal piano ha tetto 0. Piani e `orchestrabile` si cambiano da `POST /api/config`, e `refreshConfig` li rilegge a ogni giro, anche da un altro processo.
2. **La finestra delle 5 ore** (`windowAdmits`). Un task nuovo parte se `sessione − impegnata ≥ min(85, costo)`, o se il contatore si azzera entro 20 minuti, o se ha priorità 0. L'orchestratore non fa più da cancello.
3. **Nessun ripiego.** Un task gira solo sul suo provider, altrimenti aspetta; lo spostano solo l'orchestratore o l'autore (`assegna`).
4. **Il contesto dei task.** `.pipeline-task.md`, generato al lancio e ignorato da git, porta blocco, dossier collegati e regole. L'agente non legge né scrive il backlog; chiude con una riga `ESITO`, e `integrateTask` scrive stato ed esito nel commit di merge.
5. **Integrare senza conflitti.** `integrateTask` rinumera gli ADR il cui numero è stato preso nel base, con un commit sul branch del task. `docs/adr/README.md` ha `merge=union`.
6. **Meno rumore.** Test, typecheck e build scrivono in `.pipeline/turno-<tipo>.log` e stampano un riassunto. L'epoca ruota al 35 % della finestra, senza turno di chiusura (`closeEpoch` non c'è più); `quadro.md` è una fotografia sotto le 75 righe, riscritta invece che allungata.

## Scelte che il prompt non diceva

- **Lo stato segue l'esito.** `integra` scrive `fatto` solo se l'esito è `fatto` o manca; `in attesa` resta `in attesa`; `fallito` o un esito senza riga non cambiano lo stato. Senza questo, un task integrato con `ESITO: in attesa` risulterebbe fatto e sbloccherebbe i task che dipendono da lui.
- **`merge=union` sull'indice.** La sola rinumerazione non basta: le due righe nuove cadono nello stesso punto e il conflitto resterebbe.
- **Il numero nuovo è il primo dopo il più alto,** non il primo buco: un ADR nuovo non finisce in mezzo a quelli vecchi.
- **Una riga identica nel base non si tocca:** parla dell'ADR del base.
- **`/api/orchestratore` e `assegna` rifiutano** rispettivamente chi non può orchestrare e un provider fuori dal piano.

## Conseguenze

- `sessioneImpegnata` conta la stima intera dei task in corso anche a metà lavoro, mentre `sessione` ne ha già scalato una parte: è prudente, a volte fa aspettare un task che ci starebbe.
- Le eccezioni (reset vicino, priorità 0) non superano `sogliaUnSolo`, né un provider fermo per i limiti.
- Le stime già nel backlog non sono state ricalibrate sulla scala nuova: le più alte (T183 al 9 %, T181 al 10 %) chiedono la sessione quasi piena per partire.
- I rapporti di `ratioSessioneSettimana` vengono da poche misure di `consumi.jsonl`, una sola per Fable: da rivedere con altri dati.
- Un task lanciato prima di questo cambio ha il prompt vecchio e può ancora toccare il backlog: `recordOutcome` non riscrive un blocco che dice già `fatto` o ha già l'esito.
- Restano possibili i conflitti su file condivisi come `AGENTS.md`: per quelli c'è ancora il task «Integrare Txx».
