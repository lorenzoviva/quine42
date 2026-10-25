# ADR-0066 — Il ramo del master e la pubblicazione

Data: 2026-10-25 · Stato: accettato (task T42b del backlog) · Fase 1 di ADR-0050 (il multiplayer); estende ADR-0021 (due
repository), ADR-0058 (il kernel sul server), ADR-0059 (il client sottile), ADR-0061 (il client del giocatore) e ADR-0065.

## Contesto
Il piano del multigiocatore («Modifiche in prova», proposta approvata) vuole che le modifiche del master non arrivino subito ai
giocatori: lui le prova da solo e le **pubblica** con un gesto esplicito; il Concilio automatico invece committa direttamente,
perché passa dal validatore. Con T39-T41 il master gioca come ogni client, con un kernel specchio (`KernelOptions.mirror`) che
il server riempie: l'editor salvava solo nello specchio, il server non ne sapeva nulla, e nessun client riceveva più i file del
mondo dopo l'`ingresso` (ciò che il Concilio committava restava sul server). `R` del master era in `LATER` di `thin.ts`.

## Decisione
1. **Il ramo è dello specchio del master.** Ogni salvataggio valido dell'editor è un commit dello specchio (come in singola:
   ricarica a caldo, il codice invalido si scrive senza commit). Il ramo è ciò che l'ultimo commit dello specchio ha di diverso
   dai file del mondo che il server gli ha detto (`ThinClient.main`): a ogni commit (`Repo.onCommit`) il client lo manda intero
   (`ramo {files, base}`: il testo o null per ogni file, e l'hash della versione del mondo da cui è partito). Lo specchio non
   scrive file suoi nei commit (`beforeCommit` solo fuori dallo specchio: consumi, carte e grafo restano del server).
2. **Il server lo tiene da parte.** `SessionServer` accetta il ramo solo dal master (percorsi dentro l'universo, al più 2000
   file da 4 MB), non lo applica al mondo, lo rimanda al master nell'`ingresso` (`ramo`: ritrova il ramo se ricarica la scheda)
   e lo scrive su disco: `refs/heads/rami/master` nel repository dell'universo, un commit sul principale com'è adesso più i file
   del ramo, scritto con un indice temporaneo senza toccare la cartella di lavoro (che è del principale); il messaggio finisce
   con `base: <commit>`, così al riavvio (`host.ts`, `readBranch`) si rilegge cosa cambia. I rami stanno sotto `rami/` perché il
   ramo principale di un universo creato con `git init` può chiamarsi già `master`.
3. **La pubblicazione è un merge in cui vince il master.** `pubblica` (solo il master; «Pubblica (n)» nell'editor e nella
   scheda dei commit della console): `kernel.publish` valida ogni file, lo applica e fa un commit del principale («pubblicazione
   del master: …»); se il mondo si romperebbe (un manifest, un modulo che non si carica) torna com'era e la pubblicazione è
   rifiutata con il motivo. Un file del ramo che il mondo ha cambiato nel frattempo (l'hash non è più la `base`) prende la
   versione del master e il registro del Concilio lo dice; i file che il master non ha toccato restano del mondo. Su disco il
   ramo si fonde nel principale (`merge -s ours --no-ff`: l'albero è già quello pubblicato) e sparisce.
4. **I file del mondo arrivano ai client.** A ogni aggiornamento (10 Hz) il server confronta i file del kernel con quelli che i
   client conoscono (una copia: i file del kernel possono essere i file di lavoro del repository, scritti sul posto) e manda ciò
   che è cambiato (`file`): al master tutto, a un giocatore solo ciò che `playerFiles` gli darebbe (`playerChanges`: un modulo
   cambiato torna intero, senza codice né casi tranne `PER_WANDERER`). Lo specchio li prende in un commit suo («dal mondo: …»),
   tranne, per il master, i file del suo ramo, che restano i suoi; una modifica non ancora committata resta sopra.
5. **`R` del master riporta il ramo all'ultimo valido** (o a un commit dello specchio, dalla console): il mondo, le sue rune e il
   repository del server restano come sono; il ramo che ne viene va al server. Un giocatore resta senza `R` dal client (`LATER`).

## Conseguenze
- Il master prova da solo ciò che il suo client disegna e fa girare: modelli, aspetto, terreni, manifest, la corona, il cammino
  (`PER_WANDERER`). La logica del mondo gira solo sul server: un `logic.lua` cambiato sul ramo si vede all'opera dopo la
  pubblicazione.
- Le rune incise nella corona e le richieste al Referente non passano ancora dal server in multigiocatore: sul ramo vanno con
  T42e. Il clone con un altro master è T42d.
- `tests/branch.test.ts`: una modifica del ramo arriva ai giocatori solo dopo la pubblicazione; ciò che il Concilio committa
  intanto arriva a tutti, sullo stesso file vince il master e il registro lo dice; solo il master ha un ramo, `R` lo riporta
  all'ultimo valido, il ramo lo aspetta quando rientra; un giocatore riceve solo i file che il suo client ha; il ramo su disco si
  scrive accanto al principale senza toccarlo, si rilegge dopo altri commit del principale e si fonde con due genitori.
