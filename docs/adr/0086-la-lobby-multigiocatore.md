# ADR-0086 — La lobby multigiocatore e la gestione dei crediti di sessione

Data: 2026-10-30 · Stato: accettato (task T45d del backlog) · Riferimenti: ADR-0056 (le carte dei contenuti), ADR-0058 (la sessione di gioco in multigiocatore), ADR-0081 (crediti e spese comuni), ADR-0082 (l'account), ADR-0083 (i pagamenti con Stripe), ADR-0085 (i coefficienti di generazione)

## Contesto
Nelle partite multigiocatore, il mondo è ospitato e configurato dal master dell'universo (modelli di testo e scultura, coefficienti di generazione, preset «Low Detail»). Chi entra deve poter conoscere queste impostazioni prima dell'ingresso, verificare i requisiti minimi richiesti (`minimi`) e impostare un tetto massimo di crediti spendibili per la propria sessione (`tetto`), evitando addebiti imprevisti. I crediti allocati all'ingresso incrementano proporzionalmente i budget di sessione (`maxText`, `maxForges`, `maxPacks`, `maxCast`, `maxModels`) sui prezzi correnti (`prices.ts`).

Inoltre, se durante la partita i crediti dell'utente si azzerano o raggiungono il tetto prefissato, il gioco deve proporre scelte chiare (ricaricare, passare ai modelli locali offline, oppure abbandonare la sessione), senza bloccare bruscamente l'esperienza.

Infine, fuori dalla partita (nella lobby di ingresso o nel profilo), il giocatore deve poter consultare la propria collezione di carte collezionabili (moduli, oggetti, luoghi) con i relativi conteggi di utilizzo nel mondo (luoghi, trame, prompt e totale).

## Decisione
1. **`universe.json → ai.minimi`**:
   - Proprietà opzionale configurabile dal master in `universe.json`: `tetto` (spesa minima richiesta per entrare), `textModel`, `scultoreStrutture`, `placesPerMinute`.
   - Normalizzata e validata da `repairMinimi` (`src/kernel/universe.ts`, riesportata in `validator.ts`), con tipi coerenti e valori non negativi.
2. **Tetto di spesa e incremento budget di sessione**:
   - Funzione `addBudgetFromTetto(ai, tetto)` in `src/kernel/credits.ts`: calcola le quote addizionali di chiamate e generazioni acquistabili con il tetto indicato e le somma ai budget di `ai`.
   - Il messaggio `ClientMsg.entra` accetta il campo `tetto?: number`.
   - `Kernel` tiene traccia di `sessionTetto` e `sessionSpent` per ogni viandante (`setSessionTetto`, `sessionTettoOf`, `sessionSpentOf`).
   - Quando `sessionSpent >= tetto` o il saldo crediti scende a zero, `hasCredits(id)` restituisce `false` e `deductCredits(id, amount)` emette l'evento di bus `credits:exhausted` con motivo `'tetto'` o `'finiti'`.
3. **Avviso crediti esauriti e tre scelte (`CreditExhaustedModal`)**:
   - `SessionServer` intercetta `credits:exhausted` e notifica il client tramite `Notice` (`tipo: 'crediti'`).
   - `ThinClient` cattura la notifica o l'azzeramento locale ed emette `ui:credits:exhausted`.
   - La finestra modale `CreditExhaustedModal` (`src/ui/creditdialog.ts`) offre 3 pulsanti:
     - **Ricarica**: avvia il checkout Stripe (`/api/stripe/checkout`);
     - **Offline**: passa ai modelli procedurali locali (`MockModels`);
     - **Abbandona**: disconnette il client e chiude la sessione.
4. **Schermata Lobby (`LobbyScreen`) e collezione carte**:
   - In multigiocatore (`SessionServer` / `joinMany`), se `!params.has('skip')`, viene mostrata la lobby (`src/ui/lobby.ts`):
     - Dettagli universo: modello Concilio, modelli Scultore per classe, coefficienti di generazione e stima oraria (`hourlyEstimate`);
     - Minimi dell'universo (`minimi.tetto` ecc.);
     - Configurazione tetto di spesa con saldo attuale, input numerico e preset rapidi ($1, $2, $5, Tutto);
     - Sezione «La tua collezione di carte»: elenca le carte del viandante (`collectionOf(files, wandererId)`), raggruppate per tipo, con il numero di utilizzi (luoghi, trame, prompt, totale) da `world/carte.json`;
     - Azioni per entrare, giocare offline o ricaricare crediti.
5. **Test**:
   - `tests/lobby.test.ts` collauda: validazione minimi, incremento quote `addBudgetFromTetto`, applicazione del tetto in sessione con fallback locale e avviso, conteggio utilizzi carte della collezione, e apertura/interazione della lobby e modale crediti.

## Conseguenze
- Trasparenza completa su costi e configurazione prima di unirsi a una sessione multigiocatore.
- Sicurezza contro spese involontarie oltre il tetto deciso dal giocatore.
- Transizione fluida e non distruttiva tra modalità online con crediti e modalità offline a modelli locali in caso di esaurimento crediti.
