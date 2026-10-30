# ADR-0089 — L'orchestratore sobrio: chiamate solo su decisioni, contesto corretto e avvio compatto

Data: 2026-10-30 · Stato: accettato · Estende ADR-0078 e ADR-0079.

## Contesto
Durante le attese dei reset Gemini ha aperto più di 100 epoche consecutive senza compiere alcun progresso,
con risposte prolisse e consumo incontrollato di crediti. Le cause individuate:
1. Il ciclo `pump()` apriva un turno di presentazione all'avvio o a ogni nuova epoca (`st.sessione` vuota) anche in assenza di messaggi dell'autore o eventi urgenti;
2. Eventi di routine (es. `tutti fermi per i limiti`, lanci, riprese) venivano trattati come risvegli (`wakes`);
3. La misura del contesto (`contextOf`) sommava indebitamente `cache_read_tokens` a `input_tokens` per Gemini/agy, raddoppiando il conteggio della cache (già inclusa in `promptTokenCount`) e facendo credere che il contesto fosse oltre il 100% della finestra (114%) già al primo turno;
4. La pagina di avvio (`avvio.md`) era troppo pesante: includeva l'output integrale di `indice` (90+ task), chat non troncate fino a 1500 caratteri e messaggi di boilerplate ripetuti dell'orchestratore.

## Decisione
1. **Solo decisioni ed eventi urgenti (`shouldRunTurn`, `wakes`)**: il processo interpella l'orchestratore esclusivamente quando ci sono messaggi dell'autore in coda (`queued`) o eventi che esigono una decisione (esito di un task: `ESITO: fatto|fallito|in attesa`, limite raggiunto: `limite di <provider>`, fallimenti: `fallito` o conflitti di merge: `conflitti`). Gli eventi di routine (lanci, riprese, progressi, task integrati, attese `tutti fermi per i limiti`) non svegliano l'orchestratore e non aprono turni, nemmeno se la sessione è nuova o appena ruotata.
2. **Misura del contesto corretta (`contextOf`)**: in Anthropic (`cache_read_input_tokens`) i token in cache vengono aggiunti a `input_tokens` (non compresi); in Gemini/agy (`cache_read_tokens`) la cache è un sottoinsieme di `input_tokens` e non viene sommata due volte quando `input_tokens >= cache_read_tokens`.
3. **Pagina di avvio compatta (`startPage`, `compactChat`)**: rimosso l'indice intero dei task (chi orchestra può consultare `pipeline.mjs indice` o il quadro); le ultime chat vengono troncate (max 250 caratteri su riga singola), limitate a 8 elementi e deduplicate filtrando boilerplate ripetuti («quadro aggiornato», annunci di epoca).
4. **Regola delle risposte brevi**: documentata in `orchestra.md` la regola di mantenere risposte essenziali e focalizzate su fatti e decisioni, senza riassunti prolissi.

## Conseguenze
- Niente epoche a vuoto né rotazioni a cascata durante le attese o lo stato di quiete.
- Dimensione di `avvio.md` drasticamente ridotta (sotto i 6-8 KB, meno di 2.000 token).
- Conteggio fedele dell'occupazione della finestra di contesto per tutti i provider.
