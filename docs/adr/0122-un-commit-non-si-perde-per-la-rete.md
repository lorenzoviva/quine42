# ADR-0122 — Un commit non si perde per la rete: resta in fila, in ordine

Data: 2026-11-03 · Stato: accettato · Riferimenti: ADR-0021 (due repository), ADR-0103 (percorsi ammessi), ADR-0121 (`stop()` e i lock), T205, T211

## Contesto

`Repo.commit` manda al disco solo ciò che è cambiato dal commit prima. `UniverseClient.commit` a un errore scriveva un avviso e andava avanti, quindi un commit fallito non tornava più:
il commit seguente non lo portava con sé, mondo e disco restavano diversi e `R`, dopo un riavvio, non poteva tornarci. T205 l'ha visto una volta, con il «fetch failed» di un commit dell'Arbitro.

## Decisione

- **I commit stanno in una fila** (`owed` in `UniverseClient`): il primo si scrive, gli altri aspettano dietro. L'ordine non cambia mai e il gioco non aspetta, perché `Repo.commit` non attende la promessa.
- **Tre esiti per un fallimento** (`failureKind`):
  - nessuna risposta, oppure 408, 429, 502, 503, 504: il commit **aspetta**. Tre nuovi tentativi (dopo 0,2, 1 e 4 s), poi resta primo in fila. Da lì un tentativo a ogni commit nuovo e uno ogni 30 s da solo;
  - altri 5xx: **pochi tentativi**, gli stessi tre, poi il commit si scarta con un avviso. Un commit che fallisce sempre non deve fermare per sempre quelli dopo. Se il server aveva già scritto i file, li prende il commit seguente con `add -A`;
  - altri 4xx (percorso, permesso, token scaduto): **rifiuto**, nessun nuovo tentativo, si scarta con un avviso come prima.
- **Ritentare è innocuo**: se la risposta si è persa ma il server aveva scritto, i file sono uguali e `commitAll` non crea un secondo commit.
- **Ciò che viene dopo i commit li trova su disco**: `checkout`, `clone`, `branch` e `merge` scrivono prima la fila e con un commit ancora in attesa non partono (i primi due gettano, gli altri due avvisano come già facevano). `reset` prova una volta, e se riesce la fila finisce con l'universo nel cestino.
- **Chi si ferma** aspetta entro i suoi tempi (`FLUSH_MS`), poi `close()` smette di ritentare e dice quanti commit restano.
- **Il messaggio dice la causa**: `lastError` riporta anche il `cause.code` che Node tiene sotto «fetch failed», così il prossimo caso si può leggere nei log.

## Scartato

- **Fondere il commit perso nel seguente**: la storia direbbe il falso, e un commit che fallisce sempre si porterebbe dietro tutti gli altri.
- **Calcolare le differenze contro ciò che il disco ha confermato**: serve la stessa fila, in più cambierebbe `Repo`.
- **Ritentare all'infinito dentro la promessa**: `await client.commit` all'avvio e chi aspetta la coda resterebbero fermi a server spento.

## Limiti

- La fila vive in memoria: se la pagina si chiude o il processo muore a server spento, i commit in attesa si perdono. Il disco resta comunque all'ultimo stato scritto, che è valido.
- La fila non ha un tetto: a server spento per ore cresce di ciò che i commit cambiano.
- `putMap` (i piani dei luoghi) e il corpo di `branch` e `merge` non ritentano. Un ramo si riscrive intero al salvataggio dopo; una `merge` persa lascia il ramo su disco, da pubblicare di nuovo.

## La causa del «fetch failed» di T205

Non trovata. «fetch failed» è la parola di Node (Chrome dice «Failed to fetch»), quindi il client era probabilmente il processo di un mondo. Ipotesi provata: un socket keep-alive scaduto mentre il ciclo degli eventi era bloccato.
Non si riproduce: 30 POST su Node 22 dopo un blocco da 4,7 a 5,6 s contro il `keepAliveTimeout` di 5 s di un server `http` puro, nessun fallimento. Lo stesso senza blocco, 2 POST: nessun fallimento. I log di quella partenza non ci sono più.
