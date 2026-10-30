# ADR-0090 — Spegnere la pipeline in modo sicuro: `ferma --ora`, `ferma --dopo`, il riepilogo al riavvio

Data: 2026-10-31 · Stato: accettato · Estende ADR-0072, ADR-0078 e ADR-0079.

## Contesto
L'autore voleva fermare tutto senza un Ctrl+C brutale, anche chiedendolo all'orchestratore in chat («chiudi ora tutti i task e
spegni», «aspetta che finiscano e spegni»). Prima c'erano solo `interrompi --tutti` (i task restano interrotti finché qualcuno non
fa `riprendi`) e `/esci` (il processo chiude, i task continuano da soli); il Ctrl+C uccideva il processo lasciando le esecuzioni
«in corso» e, al riavvio, un task finito mentre la pipeline era spenta veniva ripreso da capo come se fosse sparito. Il nuovo
orchestratore non sapeva cosa era successo.

## Decisione
1. **Una richiesta su disco** (`.pipeline/arresto.json`, `requestStop` in `pipeline.mjs`), data da `ferma --ora|--dopo` (anche
   dall'orchestratore, con la sua shell), da `/ferma ora|dopo` (terminale o coda della chat web) o da Ctrl+C (`ferma --ora`, un secondo
   Ctrl+C esce subito). Il processo che fa girare la pipeline scrive `.pipeline/processo.json`; `execute` controlla la richiesta ogni
   secondo durante l'attesa.
2. **`ora`**: ogni task in corso è interrotto (`interruptTasks` con `spegnimento`: stato `interrotto`, conversazione tenuta), la
   pipeline si spegne appena i processi sono chiusi. Al riavvio questi task riprendono da soli la loro conversazione (a differenza di
   `interrompi`, che aspetta `riprendi`).
3. **`dopo`**: niente lanci nuovi né riprese; la pipeline aspetta che i task in corso finiscano, poi si spegne. In `orchestra`
   l'orchestratore aggiorna prima il quadro.
4. **Il registro dello spegnimento** (`.pipeline/spegnimento.json`, `shutdownRecord`): quando, come, chi; interrotti, finiti
   nell'attesa, ancora in corso (con `/esci`), fermi per i limiti. Senza una pipeline accesa `ferma` lo scrive subito.
5. **Il riavvio** (`recoverRuns`): un'esecuzione «in corso» il cui processo non c'è più ma il cui log ha la riga `ESITO:` è finita
   mentre nessuno guardava, e si chiude come tale (non si riprende); gli interrotti allo spegnimento tornano in coda. `orchestra`
   apre un'epoca nuova e la pagina di avvio ha la sezione «Lo spegnimento di prima» (`shutdownSummary`): cosa era in corso, cosa è
   stato interrotto, cosa è finito nell'attesa o mentre era spenta (con gli esiti), cosa lavora ancora.
6. Il processo che tiene un'esecuzione non ne annulla l'interruzione scritta da un altro (`saveRuns`, `keepInterruption`).

## Conseguenze
- Spegnere non perde lavoro né crediti: le conversazioni si riprendono, i task finiti da spenti non ripartono.
- L'orchestratore ricomincia sapendo cosa è successo, senza leggere i log.
- Con `PIPELINE_STATE` anche lo storico dei consumi va nella cartella di prova: i test fanno girare `esegui` vero con una CLI finta.
