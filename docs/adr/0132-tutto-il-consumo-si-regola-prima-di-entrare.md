# ADR-0132 — Tutto il consumo si regola prima di entrare, e a partita in corso non cambia

Data: 2026-11-04 · Stato: accettato (task T247 del backlog) · Riferimenti: ADR-0053 (la partita scelta alla Genesi), ADR-0085 (i coefficienti), ADR-0086 (la lobby), ADR-0102 (chi può scrivere), ADR-0109 (gli elenchi), ADR-0114 (un mondo solo finché c'è qualcuno), ADR-0116 (l'Attore)

## Contesto

L'autore (04/11): «il consumo deve essere tutto tunabile in lobby pre game». La lobby faceva regolare al master solo l'Attore; modello del Concilio, modelli dello Scultore, coefficienti, budget e minimi erano solo mostrati. In `CENSUS` 24 compiti su 41 erano `non regolabile`. Decisione dell'autore: **tutte le manopole si bloccano a partita in corso**; il master poteva invece cambiare `ai` in ogni momento (`setAi`, l'editor).

## Decisione

1. **La lobby regola tutto** (`src/ui/lobby.ts`): preset, ogni coefficiente, ogni modello, ragionamento, Attore, budget (`BUDGET_SCALE`) e minimi, con la stima di un'ora che segue i valori. Ogni manopola dice accanto a sé cosa fa il gioco a 0 (`COEFFICIENT_INFO.minimo`): così il viandante capisce cosa succede, senza che se ne parli nel mondo (regola 0). Gli altri vedono gli stessi valori e non li toccano.
2. **Otto manopole nuove** (`luoghi parole sguardi azioni magia morte riparazioni studio`): ogni riga di `CENSUS` ha una manopola, tranne la Genesi. Una quota: con 0,5 una chiamata su due, sempre nello stesso ordine, senza estrazioni (`Rationing`). Ciò che la manopola non lascia passare va ai **modelli locali**, lo stesso percorso dei crediti esauriti (`Council.write`, `Council.rationed`): nessun compito nuovo per il gioco a zero. `riparazioni` è diversa: una riparazione locale svuoterebbe il modulo, quindi il kernel non chiede, il modulo resta isolato dal suo guasto e resta una mancanza (ADR-0130). In «Low Detail» restano a 1: risparmiare non toglie un modo di giocare senza dirlo.
3. **A 0 nessuna chiamata, per ogni riga** (`knobOfTask`): anche i coefficienti indiretti, che diradano ciò che causa le chiamate e non le chiamate. Chi parla con una persona senza nome non chiama il modello con `persone` a 0.
4. **Le regolazioni entrano con il master**: nel messaggio `entra` (`regolazioni`), dentro il `join` sincrono del server, così nessuno si infila tra il controllo e la scrittura. Il messaggio `attore` non c'è più. `repairAiSettings` (`universe.ts`) è un elenco: passano solo i campi nominati, i modelli del listino, i budget entro la scala; `provider` e `agenti` non ci sono. Il client le dice una volta sola: rientrare in un mondo ripartito non è scegliere di nuovo.
5. **Cosa vuol dire «partita in corso»**:
   - **In una partita di molti**: da quando il primo viandante è entrato (`clients` non vuoto) a quando l'ultimo è uscito. Conta un viandante qualsiasi, anche il master stesso con un'altra scheda. Il mondo può restare acceso fino a 5 minuti da vuoto (ADR-0114), ma non è una partita: il primo che entra, se è il master, regola. Se entra un altro, si fissano quelle che ci sono; il master che arriva dopo è ammesso e il suo cambio è rifiutato, con il motivo.
   - **Da solo**: da quando chi gioca chiude la lobby (o la Genesi, o apre con `?skip`) a quando ricarica la pagina. Il kernel è nel suo browser e dalla sua console può tutto (regola 3): non è un confine di sicurezza, solo la stessa regola.
6. **Chi lo fa rispettare**: il kernel (`setAi` risponde `false`, `applySettings` rifiuta; `keepSettings` riscrive un `universe.json` che dice altro, come `keepGame` per la partita, qualunque sia la via: editor, rollback, pubblicazione) e il server (il `join`; `takeBranch` toglie `ai` da ciò che il ramo porterebbe nel merge su disco; `/api/universe` rifiuta a chi non è il mondo un `commit` o un `branch` che cambi `ai` in un universo di molti).
7. **I minimi valgono davvero**: `withinMinimums` sta in `readConfig`, così vale per ogni via, anche per un file scritto a mano a mondo fermo. Una manopola non scende sotto il suo minimo, un modello non è più economico del minimo (il prezzo del listino è l'ordine). Il tetto minimo prima lo controllava solo la lobby: ora il server rifiuta chi entra chiedendo un tetto sopra 0 e sotto il minimo; 0 (i modelli locali) e nessun tetto entrano. `repairMinimums` tiene solo ciò che è nominato: un minimo non detto non è 1.
8. **La lobby per chi gioca da solo**: la stessa schermata con `alone`, senza tetto, ricarica né carte, a ogni apertura di un universo già generato, se ci sono i modelli (senza, non c'è nulla da regolare; `?lobby` la forza per le prove). Finché non si entra niente chiama i modelli (`generationHeld`). Un universo mai generato ha la Genesi, con gli stessi coefficienti.

Il tetto di spesa del singolo viandante e le scelte a crediti esauriti (ricarica, offline, abbandona) sono suoi, non del master, e restano anche a partita in corso.

## Conseguenze

- Un compito nuovo in `CENSUS` senza manopola fa fallire `tests/regolazioni.test.ts`, che controlla anche che ogni `ask`/`write` del kernel sia nel censimento: è così che è emerso `review.fourthwall`, una chiamata mai censita, ora sotto `sessioni`.
- La Genesi resta senza manopola: viene prima della lobby. La domanda è in `docs/pipeline/domande/T247.md`.
- Un master non può correggere una manopola a partita iniziata: deve aspettare che escano tutti. È ciò che l'autore ha chiesto; il prezzo è un master che si accorge tardi di aver lasciato un modello caro.
- I modelli locali scrivono in un tema loro: a manopole basse il mondo perde coerenza e varietà. Lo dice la riga accanto alla manopola.
- `POST checkout` e `reset` del master su un universo di molti restano possibili e possono spostare `ai` sul disco; il mondo acceso lo tiene in memoria e vale dalla partita dopo, cioè a mondo fermo.
- L'esistenza di una partita in corso è visibile da `/api/viandante` (`inCorso`): un sì o no, nessun nome.
