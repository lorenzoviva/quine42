# ADR-0081 — Crediti per viandante e spese comuni divise

Data: 2026-10-30 · Stato: accettato (task T45a del backlog) · Fase 4 di ADR-0050 (il multiplayer); estende ADR-0054 (il viandante con un id), ADR-0056 (le carte e chi paga), ADR-0058 (il kernel sul server) e ADR-0070 (le rune chieste al Referente).

## Contesto
In multigiocatore (ADR-0050, ADR-0056, punto P#1 del piano multiplayer), ogni chiamata a modelli di intelligenza artificiale comporta un costo reale in dollari secondo il listino prezzi (`src/kernel/ai/prices.ts`). Per sostenere il mondo e la piattaforma:
1. Ogni chiamata online applica una commissione di piattaforma del +1% (P#1).
2. Le spese per compiti svolti per conto di un singolo viandante (`payerOf`, ADR-0056: risposte degli NPC, giudizio di «Altro…», creazioni libere, esplorazione e pianificazione dei luoghi, richieste alla Fucina) devono essere pagate interamente dal saldo crediti di quel viandante.
3. Le spese comuni (`COMUNE = 'comune'`: Genesi, sessioni del Concilio, trame orizzontali, revisioni della società, modelli mancanti, ecc.) devono essere divise in parti uguali tra tutti i giocatori attualmente connessi al server nel momento in cui la spesa si verifica, compreso il master.
4. I crediti sono mantenuti e aggiornati unicamente dal server in `world/giocatori/<id>.json`. Il master può ricaricarli a mano tramite la console del kernel o parlando con il Referente nella corona (ADR-0070).
5. A crediti esauriti (`crediti <= 0`), il viandante non blocca il gioco: le sue richieste personali vengono evase dai modelli locali offline (`MockModels`), e il viandante ne è consapevole (`stato.crediti <= 0`, avviso nel registro del Concilio).
6. Il viandante anonimo (T44b) non ha crediti (0 fisso, non ricaricabile), non contribuisce alle spese comuni e utilizza sempre modelli locali per le proprie richieste.

## Decisione
1. **Commissione di piattaforma e divisione costi** (`src/kernel/credits.ts`):
   - `costWithFee(baseCost)`: applica il moltiplicatore `1 + PLATFORM_FEE` (`PLATFORM_FEE = 0.01`).
   - `splitCost(total, count)`: suddivide il costo totale in `count` quote uguali, distribuendo l'eventuale frazione residua sui primi beneficiari affinché la somma delle quote corrisponda esattamente a `total`.
2. **Saldo crediti per viandante** (`world/giocatori/<id>.json`):
   - Aggiunto il campo `crediti?: number;` in `WandererState`.
   - `Kernel.creditsOf(id)` restituisce il saldo (0 se non impostato o anonimo).
   - `Kernel.giveCredits(id, amount)` accredita l'importo solo se il viandante non è anonimo e persiste lo stato in `world/giocatori/<id>.json`.
   - `Kernel.deductCredits(id, amount)` scala l'importo e persiste lo stato.
   - `SessionServer` include `crediti: k.creditsOf(c.id)` in `MyState` (`aggiorna`), così il client specchio (`ThinClient`) conosce sempre il proprio saldo.
3. **Addebito automatico su ogni chiamata** (`Kernel.billCall`):
   - Agganciato a `this.models.onCall` (attivato solo sul kernel server reale, ignorando i kernel specchio o branch).
   - Se `r.chi === COMUNE`, recupera i viandanti connessi tramite `connectedWanderers()` escludendo gli anonimi (`!isAnonymous(id)`). Se vi sono viandanti idonei, divide il costo `costWithFee(baseCost)` in parti uguali e scala la quota dal saldo di ciascuno.
   - Se `r.chi` è un viandante, scala `costWithFee(baseCost)` dal suo saldo.
4. **Assegnazione da parte del master**:
   - Dalla **console** del kernel (scheda Universo, sezione Crediti viandanti): il master seleziona il viandante e l'ammontare e invoca `k.giveCredits(id, amount)`.
   - Dal **Referente**: il master chiede `«ricarica <N> crediti a <id>»`. Il Referente riconosce l'incarico `crediti` e restituisce `{ credits: { target, amount } }`. Nel branch del master sul server (`SessionServer.onBranch`), il server intercetta `r.credits` ed esegue `k.giveCredits(...)` sul kernel del mondo reale.
5. **Fallback a modelli locali a crediti esauriti**:
   - `Council.write`: se `chi !== COMUNE` e `!this.hasCredits(chi)`, il Concilio registra un messaggio informativo nel feed (`I crediti di <chi> sono esauriti...`) e reindirizza la chiamata a `this.localModels` (`MockModels`).
   - Non appena il master ricarica i crediti del viandante (`giveCredits`), le chiamate successive tornano automaticamente a utilizzare i modelli online.
6. **Viandante anonimo**:
   - Il messaggio `entra` del client sottile e `WandererState` supportano `anonimo?: boolean`.
   - `isAnonymous(id)` impedisce la ricarica (`giveCredits` ritorna `false`), mantiene i crediti a 0, esclude il viandante dal riparto delle spese comuni e indirizza sempre le sue richieste ai modelli locali.

## Conseguenze
- Ripartizione equa e trasparente dei costi computazionali in partite multigiocatore.
- Sicurezza del bilancio: il client non può manomettere il saldo né ricevere risposte da modelli a pagamento a credito esaurito.
- Continuità del gioco: a credito zero o in modalità anonima il giocatore può continuare a giocare offline senza errori fatali.
