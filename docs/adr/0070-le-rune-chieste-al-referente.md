# ADR-0070 — Le rune chieste al Referente

Data: 2026-10-25 · Stato: accettato (task T42f del backlog) · Fase 1 di ADR-0050 (il multiplayer); estende ADR-0057 (le rune per
ruolo) e ADR-0069 (il Concilio sul ramo del master).

## Contesto
Il piano del multigiocatore («Il master») dà al master una sola runa del tappeto, quella del Concilio (ADR-0057): «ogni altra runa la
chiede al Referente». Il Referente però non aveva un incarico per le rune (oggetto, cosa, personaggio, ambiente, regola, riscolpisci,
oggetti, meccanica, nessuno). Da T42e le richieste del master al Referente girano sul server, in un kernel del ramo che è uno specchio:
ciò che vi si committa va sul ramo, ma le rune non sono file, sono oggetti nell'inventario del viandante.

## Decisione
1. **Un incarico `runa` del Referente.** Lo schema di `referente.coordinate` ha `runa` tra gli incarichi e `rune`, le parole del codice
   chieste (una per runa, una ripetuta conta due volte); il prompt lo spiega con un esempio, `MockModels` risponde a «dammi la runa …».
2. **Quali rune: ogni token che una runa può portare** (la proposta del backlog, la domanda all'autore resta aperta). `askedRunes`
   (`runes.ts`) spezza ciò che il modello ha scritto come sul tappeto (`carpet.active=false` → `carpet . active = false`), tiene i token
   di `TOKEN_RE` lunghi al più 24 caratteri (come `rune:<token>` nel registro degli oggetti), mai la runa del Concilio (il master l'ha
   sempre), al più `ASKED_RUNES_MAX` (12) per richiesta.
3. **Solo il master, solo in multigiocatore.** In singola l'incarico non dà nulla («le rune si trovano nel mondo»): il gioco da solo non
   cambia. Un giocatore non arriva al Referente (il server rifiuta `agente` da chi non è il master, ADR-0069).
4. **Nel mondo, non sul ramo.** Il kernel del ramo risponde con le rune (`talkToAgent → runes`) senza darle (è uno specchio); il server
   le dà al master nel kernel del mondo (`as(master, grantRunes)`): nella borsa delle rune (o nelle tasche) e sulla frase, con un
   messaggio. Al client arrivano con il prossimo aggiornamento, come ogni cambio dell'inventario.

## Conseguenze
- Il master può incidere nel mondo qualunque riga, purché la chieda: le sue righe girano con i suoi diritti (ADR-0057).
- Le rune date non passano dalla pubblicazione e non si tolgono con `R` (non sono file); le chiamate del Referente le paga il master.
- `tests/referente.test.ts`: `askedRunes` (token spezzati, niente runa del Concilio, il tetto); il master chiede «dammi la runa speed» e
  la trova nell'inventario e nella frase sul server e nel suo client, il ramo resta vuoto, un giocatore che la chiede è rifiutato; in
  singola il Referente non dà rune.
