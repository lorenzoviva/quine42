# ADR-0116 — L'Attore: chi interpreta le persone, un'opzione del master

Data: 2026-11-02 · Stato: accettato (task T157 del backlog) · Riferimenti: ADR-0013 (i personaggi), ADR-0020 (la società), ADR-0025 (i due tavoli), ADR-0056 (chi paga), ADR-0085 (i coefficienti), ADR-0086 (la lobby), ADR-0102 (chi può scrivere), ADR-0109 (gli elenchi di ciò che esce)

## Contesto

Il Narratore fa tutto: la bibbia, le trame, gli individui e anche ogni battuta delle persone (`npc.reply` quando il viandante parla,
`npc.dialogue` quando due persone si incontrano, in `src/kernel/agents/minds.ts`). Ogni battuta porta con sé la persona dell'individuo
(`persona`, mestiere, famiglia, storia), i ricordi per viandante, i segreti delle trame e il vicinato del grafo. Richiesta dell'autore
(richiesta 3): separare chi crea le persone da chi le interpreta, come in un teatro: il Narratore scrive la **scheda** di ognuno, un
**Attore** la recita. Dev'essere un'opzione del master, spenta per i mondi che non la chiedono: senza di lei nulla cambia e nessuna
chiamata si aggiunge.

## Decisione

1. **L'opzione**: `universe.json → ai.attore`, un booleano, il nome di un modello (acceso con quello) o `{ acceso, modello }`; `repairAttore`
   (`src/kernel/coefficients.ts`, riesportata dal validatore) la ripara e `readConfig` la applica; spenta se non detta. Il master la sceglie
   con i modelli e i coefficienti: nella Genesi (`kernel.setAi`), nella lobby (ADR-0086: tutti la vedono, solo il master la cambia) e con
   l'editor di `universe.json`. In una partita di molti la lobby la manda con il messaggio `attore` dopo l'`ingresso`; il server lo accetta
   solo dal master (`setActor` in `src/session/server.ts`), a chiunque altro risponde con un rifiuto, e `universe.json → ai` resta un campo che
   nessun giocatore legge (`playerFiles`); `attore` è in `LOBBY_AI_FIELDS` (`publicFiles`) perché la lobby lo mostri.
2. **L'agente**: `attore` è un `AgentId` del Concilio con il suo prompt (`prompts/agents/attore.md`, che gli universi esistenti ricevono
   come ogni aggiornamento dal seme), nome, colore e sigillo in `AGENTS`. Il suo contesto è quello del Narratore per i compiti narrativi:
   principi dei due tavoli, testa della bibbia, canone delle rune, lessico, le ultime regole, il vicinato del grafo (`focus`). Nello
   studio ha per ora solo la console della Direzione e la scrivania del registro dal vivo (nascono da `AGENTS`); gerboa, posto al tavolo
   del Concilio e sala sono di T158.
3. **La scheda** (`Person.scheda {testo, impronta}` in `world/people.json`): il Narratore la scrive una volta per individuo (compito
   `npc.sheet`, `kernel.ensureSheet`) alla sua prima battuta, mai alla creazione dell'individuo (chi non parla mai non costa nulla) e mai
   se l'Attore è spento; la riscrive solo quando cambia ciò da cui è nata — persona, mestiere, storia, età, genere e **legami** (anche con un
   viandante: `sheetFingerprint` in `society.ts`) — non a ogni battuta. Una scheda che rompe la quarta parete (`metaBreak`) o è vuota viene
   scartata e l'Attore recita dalla persona. La scheda non contiene i ricordi: quelli vanno con ogni battuta, per viandante, come oggi.
4. **Chi interpreta** (`kernel.interpreter()`): con l'opzione accesa `npc.reply` e `npc.dialogue` vanno all'agente `attore` con il suo
   modello e la scheda nel prompt (`Interpreter` in `minds.ts`); spenta, al Narratore come prima. I nomi dei compiti non cambiano: chi paga
   (`payerOf`: il viandante che parla per `npc.reply`, `comune` per `npc.dialogue`), i limiti della sessione, le risposte dei modelli locali
   e il registro dei consumi restano quelli. La scheda la paga chi paga la battuta che la chiede (`chi`): il viandante per una
   conversazione, `comune` per un dialogo tra persone. Ciò che nasce nel dialogo (ricordi, legami, oggetti citati, missioni, azioni)
   passa dal kernel come oggi; l'Attore non inventa fatti del mondo: non sa nulla oltre la scheda, i ricordi e ciò che il mondo gli dà.
5. **Il modello predefinito dell'Attore** è `gemini-3.8-flash` (`ACTOR_MODEL`): le battute delle persone sono ciò che il giocatore legge
   di più e giudica subito; il prompt dell'Attore è corto (scheda, ricordi, vicinato: niente bibbia intera né catalogo), quindi un modello
   un gradino sopra Flash-Lite costa poco in assoluto (circa 0,35 centesimi a battuta contro 0,13); chi accende l'opzione chiede una
   recitazione migliore, non un risparmio; il modello si cambia dove si accende l'opzione (anche Flash-Lite, se si vuole solo la scheda).
6. **Il registro e i costi**: ogni battuta scrive nel registro chi ha parlato e per bocca di chi (`npc.reply` dell'Attore o del Narratore,
   `npc.sheet` del Narratore); `CENSUS` ha `npc.sheet` (indiretta, `persone`) e dice che `npc.reply` e `npc.dialogue` passano all'Attore;
   `hourlyEstimate` sposta le battute sul modello dell'Attore e aggiunge le schede solo con l'opzione accesa.

## Conseguenze

- Spenta (predefinito): identica sequenza di chiamate, stessi agenti, stessi paganti (`tests/attore.test.ts` lo afferma).
- Accesa: una chiamata in più per persona che parla la prima volta, e le battute sul modello dell'Attore. Con i valori di `HOUR`
  e i prezzi di oggi (`hourlyEstimate` sul seme, pieno dettaglio) un'ora di gioco passa da 358 chiamate e 0,96 $ a 413 chiamate e
  1,17 $ con `gemini-3.8-flash` (+0,21 $: 55 schede per 0,07 $, le 65 battute da 0,09 $ a 0,23 $), a 1,03 $ con l'Attore su Flash-Lite
  (solo le schede).
- Sicurezza: una superficie nuova, il messaggio `attore` (master soltanto, nessuna chiamata ai modelli, il nome del modello filtrato
  e riparato da `repairAttore`); `ai.attore` esce nei `publicFiles` come gli altri campi della lobby.
- La scheda di una persona che non parla con nessuno non esiste: gli universi vecchi la ricevono alla prima battuta.
- T158 porta l'Attore nello studio (gerboa, posto al tavolo, sala).
