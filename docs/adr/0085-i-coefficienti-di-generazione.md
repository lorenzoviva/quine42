# ADR-0085 — I coefficienti di generazione e la partita «Low Detail»

Data: 2026-10-30 · Stato: accettato (task T45b del backlog) · Riferimenti: ADR-0039 (registro dei consumi), ADR-0042 (lo Scultore per
classe), ADR-0053 (la partita), ADR-0056 (chi paga), T67 (`docs/conversazioni.md`), risposta 4 in `docs/pipeline/domande/T45.md`

## Contesto
L'autore vuole poter giocare a risparmio. Non un moltiplicatore sui budget di sessione (`maxText`, `maxPacks`…): i coefficienti
devono regolare **quanto spesso ogni agente interroga l'IA**; direttamente dove c'è un ritmo, indirettamente dove no (per esempio meno
persone), e dove non si può va detto al giocatore. La scelta dei modelli degli agenti va bene.

## Decisione
1. **`universe.json → ai.coefficienti`**: nove coefficienti da 0 (mai) a 1 (come sempre), in `src/kernel/coefficients.ts`
   (`COEFFICIENT_KEYS`, `COEFFICIENT_INFO`). Il validatore li ripara (`repairCoefficients`, riesportato da `validator.ts`, chiamato da
   `readConfig`): numeri fuori scala tagliati, «0,5» e «50%» capiti, chiavi ignote tolte, ciò che manca vale 1; una stringa è il nome
   di un preset (`low detail`, `pieno`). `kernel.coefficients()` li legge; a differenza della partita possono cambiare dopo la Genesi.
2. **Diretti** (un ritmo che si allunga: `stretch(base, c) = base / c`, infinito a 0; `onBeat`):
   - `sessioni`: le sessioni del Concilio ogni 12 luoghi (e la prima al terzo, tranne a 0);
   - `dialoghi`: al più un dialogo tra persone ogni 40 / c secondi (a 0 solo i saluti, senza IA);
   - `trame`: una trama nuova solo nei giorni multipli di 1 / c;
   - `revisioni`: lo Scultore (`sculptPlan`): sotto 0,75 un programma solo per le cose semplici, sotto 0,5 niente revisione per figure
     e strutture, sotto 0,25 niente giudizio dell'Artista (resta il primo programma che passa i controlli del kernel);
   - `modelli`: una pausa di 60 · (1 / c − 1) secondi del mondo tra un modello e il successivo (`modelGap`; a 0 i modelli generici).
3. **Indiretti** (meno di ciò che causa le chiamate; ogni scarto è un'estrazione del seme dell'universo per l'origine della cosa,
   uguale a ogni caricamento, `kept`):
   - `persone`: meno persone per luogo (individui, risposte, dialoghi);
   - `abitanti`: un tipo nuovo ogni 7 / c luoghi;
   - `pacchetti`: un pacchetto di oggetti ogni 10 / c luoghi;
   - `cose`: meno cose nuove che il Cartografo chiede alla Fucina per un luogo e meno oggetti sconosciuti a terra.
4. **Non regolabili**: ciò che chiede il viandante (parole, «Altro…», «Esamina», «Leggi», fabbricazione, incantesimi nuovi, morte,
   Referente), il piano di ogni luogo nuovo (quanto si esplora), la Genesi, le riparazioni del codice. Il censimento delle 38 chiamate
   di `docs/conversazioni.md` è `CENSUS` (diretta, indiretta, non regolabile, con il coefficiente).
5. **«Low Detail»** (`LOW_DETAIL`): circa un quinto delle chiamate che il mondo fa da sé e lo Scultore su Flash-Lite anche per figure,
   strutture e Artista (3.8 Flash per le importanti).
6. **La schermata della Genesi** (`aiForm` in `src/ui/genesis.ts`) ha «Il dettaglio e i modelli»: il preset, un cursore per
   coefficiente (con ciò che regola), il modello del Concilio (`ai.textModel`) e quelli dello Scultore per classe (`ai.scultori`), e la
   **stima di un'ora di gioco** (`hourlyEstimate`: chiamate e dollari per voce sui prezzi di `prices.ts`, con le ipotesi di `HOUR`,
   capate dai budget di sessione), che dice anche ciò che non si regola. `kernel.setAi` lo scrive in `universe.json` (anche con
   «Gioca l'universo di esempio»); il modello del testo cambia senza ricaricare (`Models.textModel`). La lobby (T45d) userà lo stesso.

## Conseguenze
- Con «Low Detail» un giro di 24 luoghi offline (`tests/coefficients.test.ts`) fa gli stessi piani dei luoghi e meno della metà delle
  chiamate che il mondo aggiunge da sé (sessioni, pacchetti, Fucina, individui).
- La stima oraria è un'ipotesi detta come tale; ciò che si spende davvero resta nel registro dei consumi (ADR-0039).
- Un nuovo compito degli agenti va nel censimento con il suo modo; un nuovo ritmo prende un coefficiente esistente o uno nuovo.
