# ADR-0142 — Il motore MarkovJunior guarda solo dove serve, senza cambiare un voxel

Data: 2026-11-05 · Stato: accettato (domanda D33 di T258, opzione A) · Riferimenti: ADR-0036, ADR-0135, `docs/pipeline/domande/T258.md`

## Contesto

Le strutture con la cantina girano a Enorme in una scatola di 120×120×112 (1,6 milioni di celle). La cantina scritta a mano usava 5,6-6,8 s degli 8 concessi, la locanda del modello li superava. Il profilo dice dove: l'85 % del tempo è la scansione intera dei pattern. Un nodo che riparte (un figlio di `sequence` che tocca a lui, i figli di `markov` dopo l'ultimo) rilegge tutta la griglia per ogni variante di simmetria, e un edificio ha centinaia di nodi. Il resto è l'aggiornamento incrementale, con `Map.get` sulle chiavi che non ci sono.

## Decisione

1. **Un censimento delle lettere per riga** (`Census` in `src/mj/engine.ts`): quante celle di ogni lettera stanno in ogni riga (z, y), aggiornato da `write`, ricostruito se la griglia cambia (`map`). La scansione di un pattern sceglie le sue celle d'ingresso più rare, salta il pattern se una non c'è, salta le righe dove le più rare non ci sono e, nelle altre, prova solo dove sta la più rara. Visita le origini in ordine crescente, come la scansione di tutta la griglia: le chiavi entrano nello stesso ordine.
2. **L'ordine delle chiavi è parte dell'esecuzione.** `one` sceglie un indice in `MatchSet.keys`, `all` lo mescola: ogni versione del motore aggiunge in coda e toglie spostando l'ultima nel buco, come prima. La mappa delle posizioni si costruisce solo quando serve; un filtro a secchi dice senza chiedere alla mappa che una chiave non c'è. Il controllo di un pattern legge prima le celle con meno lettere ammesse: la risposta non dipende dall'ordine.
3. **`conv` salta le righe senza celle d'ingresso**: lì non estrae numeri casuali e non scrive, quindi la sequenza del generatore è la stessa. I buffer di `all` e dei timbri sono condivisi fra i nodi.
4. **La prova è una fixture di impronte** (`tests/fixtures/mj-engine-hashes.json`, `lab/scripts/mj-hashes.ts`): ogni modello del seme alla sua scatola del gioco su due semi, con le azioni e le animazioni, e i programmi di riferimento del banco e le due locande a Grande ed Enorme. È stata presa con il motore di prima; `tests/mj-engine-determinism.test.ts` la confronta. Chi cambia il motore non la riscrive: se un'impronta cambia, ha cambiato il gioco.

## Conseguenze

- A Enorme la cantina passa da 5,62 s a 0,51 s di media, `locanda/1/seconda` da 5,82 s a 0,29 s (e passa `giudica` a 5 semi su 5 alle due taglie col limite di 8 s), forte e tempio da 2,78 e 2,20 s a 0,92 e 0,60 s (`lab/banco/suolo/D33.md`). Nessuna soglia e nessun limite cambiano; `FORMS_DB_VERSION` resta com'è perché nessun voxel cambia.
- Il censimento costa memoria (un `Int32Array` per lettera presente, di Y·Z celle) e qualche operazione per ogni scrittura; su una griglia piccola il guadagno è minimo ma non c'è perdita misurabile (la suite dei modelli scende da 74 s a 13 s).
- Resta lento ciò che non è scansione: l'aggiornamento incrementale dei pattern grandi (forte) e `path`, che rifà la distanza su tutta la griglia a ogni passo.
