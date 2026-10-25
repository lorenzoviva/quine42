# ADR-0069 — Il Concilio sul ramo del master

Data: 2026-10-25 · Stato: accettato (task T42e del backlog) · Fase 1 di ADR-0050 (il multiplayer); estende ADR-0066 (il ramo del
master), ADR-0058 (il kernel sul server) e ADR-0061 (il client del giocatore).

## Contesto
Il piano del multigiocatore («Modifiche in prova») vuole sul ramo del master tutte le sue modifiche: l'editor, le rune scritte nella
corona, le richieste al Referente. T42b ha portato sul ramo l'editor e il suo `R`. Nella corona, però, il master parlava con il
Referente e con le squadre (`talkToAgent`) nel suo kernel specchio, che ha i modelli finti (`MockModels`): ciò che ne veniva era
finto, non pagato e non passava dal server, che è l'unico ad avere il Concilio (ADR-0060). Il Referente non è un'entità del server
(è un avatar dello studio, che è dello specchio). Le rune, nella corona, non si incidono: non c'è tappeto (`inscribe` lo rifiuta fuori
dal cerchio); l'unica che vale lì è la runa del Concilio, che sposta il master e non cambia file.

## Decisione
1. **Le richieste del master al Concilio girano sul server.** Nello specchio del master `talkToAgent` (Referente e squadre, dal
   pannello di dialogo dello studio) diventa il messaggio `agente {agente, testo}`; il server lo accetta solo dal master e solo per
   un agente del Concilio (`AGENTS`), e lo esegue con il suo Concilio, una richiesta alla volta (coda).
2. **In un kernel del ramo.** `kernel.branchKernel(files, master)` avvia accanto al mondo un secondo kernel con i file del mondo più
   il ramo: gli stessi modelli (budget comuni; `onCall` torna al registro dei consumi del mondo), le parole del suo Concilio ripetute
   nel registro del mondo (il master le vede, le squadre camminano), il master come viandante che agisce (paga e firma le carte di
   ciò che chiede, `payerOf`), e niente di suo: è uno specchio (nessuna generazione, salvataggio, riparazione o tick). Prima di ogni
   richiesta torna al mondo e al ramo come sono adesso (un commit «il mondo e il ramo del master»); resta acceso tra una richiesta e
   l'altra, così il Referente ricorda la conversazione.
3. **Ciò che committa è del ramo.** Ciò che la richiesta ha committato nel kernel del ramo (solo il valido) entra nel ramo del server
   (la `base` dei file nuovi è la versione del mondo da cui è partito; un file tornato uguale al mondo esce dal ramo), va su disco
   come ogni ramo (`refs/heads/rami/master`) e arriva al master (`ramo {files}`, poi l'`esito` con la risposta e `fatto`, ciò che il
   Concilio ha fatto). Lo specchio lo prende come un commit suo («il Concilio sul tuo ramo: …»), che torna al server come ramo intero
   (T42b); una modifica non ancora committata resta sopra. Il mondo e i giocatori lo vedono solo dopo la pubblicazione.
4. **Le rune nella corona restano come sono.** Non c'è niente da portare sul ramo: nella corona non si incide e la runa del Concilio
   non cambia file. «Ogni altra runa la chiede al Referente» (il piano) è un incarico nuovo del Referente, nel backlog (T42f).

## Conseguenze
- Ciò che il Referente fa fare (moduli della Fucina, ambienti e atlante, regole, pacchetti, meccaniche, riscolpire) il master lo prova
  da solo come le modifiche dell'editor, con i limiti di T42b: il suo client disegna e fa camminare, la logica gira dopo la pubblicazione.
- Il lavoro che il kernel del ramo farebbe dopo la risposta (lo Scultore che scrive un modello nuovo, chiamato dal `ModelDirector` a
  ogni tick) non avviene lì: il modello lo scrive il mondo dopo la pubblicazione, come per ogni cosa nuova. Gli utilizzi delle carte
  nei prompt del kernel del ramo (`world/carte.json`) non si contano.
- Un secondo kernel per universo sul server, avviato alla prima richiesta del master.
- `tests/referente.test.ts`: una regola e un luogo chiesti al Referente sono sul ramo (server e specchio), non nel mondo né nei file
  di un giocatore; pubblicati arrivano a tutti; il ramo tiene insieme le modifiche dell'editor e ciò che il Concilio ha fatto, una
  seconda richiesta parte dal ramo com'è; un giocatore che chiede al Concilio è rifiutato.
