# ADR-0147 — Fuori vista: la contabilità dei luoghi che nessuno vede, il ritorno, `on_return`

Data: 2026-11-05 · Stato: accettato (task T245f del backlog) · Riferimenti: D8 dell'autore (04/11: il progetto lasciava aperta la fase), `docs/design/comportamento-npc.md` (sezione 5), `docs/design/espressivita.md` (primitiva O), ADR-0110 (il mondo di molti in un processo), ADR-0114 (il mondo vuoto si ferma), ADR-0140, ADR-0141, ADR-0145, ADR-0146

## Contesto

Un luogo lontano dai viandanti non ha entità né Lua: i suoi individui esistono solo in `people.json`. Con le imprese (ADR-0145) e gli stadi (ADR-0146) una casa che nessuno guarda resterebbe ferma per sempre, il granaio vuoto, il campo seminato com'era. Il progetto chiede che chi torna dopo una settimana trovi la casa ai muri, il campo maturo, il granaio pieno: veda il risultato, non il lavoro, senza simulare dove nessuno guarda.

## Decisione

1. **La contabilità, una volta al giorno**, nel kernel, quando il lavoro del giorno finisce (comincia la sera; `awayTick`), senza Lua e senza chiamate. Un'impresa aperta il cui luogo non è caricato prende dal deposito del suo luogo ciò che le serve ancora e aggiunge il lavoro di un giorno per ognuno della sua squadra (`AWAY_WORK`: i secondi della fase `giorno` meno un quinto per il cammino), sempre fin dove i materiali lo permettono (`addWork`). Ogni individuo con un mestiere, di un luogo non caricato e in nessuna impresa, aggiunge al deposito del suo luogo ciò che il suo mestiere ci porta in un giorno (`dailyProduce` in `jobs.ts`: ciò che raccoglie o produce e poi porta al deposito; ciò che si produce consuma il suo `con` dal deposito), fino a 60 per oggetto (`AWAY_DEPOSIT_CAP`: un granaio è pieno). Un orologio spostato in avanti conta una volta sola: ciò che non è stato vissuto non è lavoro.
2. **Il ritorno** (`returnToPlace`, in `applyPlan` prima di posare i lotti): ciò che matura matura per data (`matureChunk`, la stessa regola dei luoghi caricati, ADR-0140), e il piano prende lo stadio che le sue imprese hanno raggiunto (`ventureIntoPlan`), così l'edificio si posa già a quello stadio. I bivi fuori vista non ci sono ancora (T245h).
3. **`on_return(luogo, trascorso)`**: un hook nuovo dei moduli. Quando un luogo lasciato torna a caricarsi, ogni modulo che lo dichiara lo riceve con la chiave del luogo e i secondi del mondo passati da quando è stato lasciato. Il kernel lo sa dal piano: `plan.visto` (i secondi del mondo in cui il luogo è stato lasciato) si scrive quando il luogo si scarica e si toglie quando torna, quindi c'è solo mentre nessuno lo vede; un luogo caricato alla chiusura e alla riapertura non ha un ritorno. Le imprese e i mestieri non ne hanno bisogno: è per le meccaniche future (la primitiva O di T183).
4. **Il tempo a mondo fermo resta fermo** (come proponeva il progetto): un mondo di molti vuoto si ferma (ADR-0114) e l'orologio con lui; la contabilità conta i giorni del mondo vissuti, non quelli dell'orologio di chi gioca.
5. **Nel mondo di molti** è lo stesso kernel nel processo del mondo (regola 8g): con due viandanti lontani dal luogo e fra loro, il luogo non è caricato da nessuno e va avanti per contabilità; chi ci torna ne vede il risultato (lo stadio arriva con l'entità, ADR-0146). Nessun segreto nuovo, nessuna rotta, nessun messaggio; nessuna chiamata ai modelli, quindi nessuno paga.

## Alternative scartate

- **Simulare i luoghi scaricati** (Lua senza entità, o caricarli di nascosto): il costo del tick crescerebbe con il mondo, e il budget è di tutti.
- **La contabilità al ritorno in una volta** (`trascorso` × ritmo): darebbe lo stesso risultato per le imprese, ma non riempirebbe i depositi per chi li usa da altri luoghi, e lascerebbe a un salto dell'orologio il valore di giorni vissuti.
- **Un ritmo di produzione nei programmi** (`produce {oggetto: n al giorno}`, come diceva il progetto): un campo in più da scrivere e da validare; il programma dice già cosa raccoglie, cosa produce e cosa porta al deposito.

## Conseguenze

- `tests/fuorivista.test.ts`: ciò che un mestiere porta al deposito in un giorno; un luogo lasciato in cui l'impresa va avanti per contabilità, il deposito si svuota per lei e si riempie dai mestieri di un luogo lontano, e al ritorno il campo è maturo, la casa allo stadio raggiunto, `on_return` dice quanto; un mondo di molti con due viandanti lontani.
- Kernel 0.1.8 (compatibile: un campo in avanti nel piano, un hook in più).
- Sicurezza: nessuna superficie nuova. La contabilità è lavoro del kernel una volta al giorno di mondo (un giro su `people.json`, al più 200 individui, e sulle imprese aperte, al più 12); `visto` sta nel piano, che non va ai client; `on_return` è un hook come gli altri, con i limiti della sandbox.
