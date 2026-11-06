# ADR-0160 — Le strutture grandi crescono a regole nel gioco: il prompt procedurale dello Scultore, un programma per più taglie e più semi

Data: 2026-11-06 · Stato: accettato (task T156 del backlog) · Riferimenti: ADR-0042 (lo Scultore), ADR-0092 (le taglie), ADR-0135 (la lettera del suolo), ADR-0142 (il motore che guarda solo dove serve), T179 (la traccia), T180 (varianza e scala), T182 (il prompt procedurale), T258

## Contesto

Il banco (T154-T182) ha portato le strutture da scatole di sole `<box>`, statiche e legate a una taglia (31 programmi su 31), a programmi che crescono a regole da uno scheletro (`lab/banco/riferimento/cantiere.xml`): reggono a 5 semi e 2 taglie e variano. L'autore ha chiuso T182 il 04/11: la ricchezza dei programmi a regole basta, le campate restano sgombre, gli interni li farà un altro agente. Nel gioco però lo Scultore riceveva il prompt di prima, con gli esempi della libreria (scatole), scriveva la `size` nella radice (`withSize`), provava un seme a una taglia; una struttura aveva un seme solo (`SEEDS.structure = 1`), e l'id `struttura-<concetto>` non aveva la taglia, così un forte Gargantuesco vestiva quello Enorme alla taglia Enorme (README del banco, «Cosa fa oggi il gioco con due taglie»).

## Decisione

1. **Il prompt**: `prompts/agents/sculptor.md` (`scultore.md` prima del contratto 0.3) ha due parti, separate da `<!-- strutture -->`. Prima, quella di sempre, per ogni altra classe (immutata: le classi semplici non cambiano). Dopo, il prompt procedurale del banco (`lab/banco/prompt.md`) senza la ricetta della cantina, che il gioco non chiede (`cellar`, `sotto` prima del contratto 0.4, non lo scrive nessun agente). `sculptorRole(files, true)` dà la seconda parte; un universo con il file di prima (o riscritto dal giocatore) dà la prima. Gli universi ricevono il prompt dal seme come ogni aggiornamento (`upgradeFromSeed`), i modelli scolpiti non cambiano.
2. **Chi lo riceve**: la classe `structure` da Grande in su (`procedural`), cioè le scatole di 100 voxel di lato e più, per cui lo scheletro è fatto. `building` (2,5 caselle) e `monument` restano con il prompt di prima. Niente esempi della libreria (insegnerebbero le scatole): offline la risposta dei modelli locali è lo scheletro (`skeletonOf`), che passa tutti i controlli.
3. **Senza scatola**: il programma non ha `size` (`withoutSize`): gira nella scatola della taglia di ogni voce (`sizeFor`). Il validatore prova un programma senza `size` della classe `structure` nella scatola della sua voce (`Validator.modelBox`, `Forms.structureBox`, e `addModel` per una voce nuova), non in quella di un oggetto.
4. **I controlli**: `checkProgram` prova un programma procedurale a `STRUCTURE_SEEDS` (4) semi alla sua taglia e al primo seme della successiva (`triedSizes`, Gargantuesca con Enorme), 2,4-2,8 s per lo scheletro; un errore dice taglia e seme (`failedAt`). Le misure del banco (piani, porta, salti, varianza) restano in `lab/`: il gioco prova ciò che il kernel garantisce, non la qualità.
5. **La seconda richiesta porta la traccia** (T179): il programma che non passa torna intero (non tagliato a 6000 caratteri) con il motivo e, nodo per nodo, ciò che ha fatto al seme e alla taglia dove è caduto (`traceOf`, il tetto di `traceText`); lo stesso nella revisione dopo l'Artista. Il messaggio dice il corpo alle due taglie e i semi (`describe`).
6. **Un programma per più taglie**: l'id ha la taglia se non è Grande (`structureModel`: `struttura-<concetto>`, `struttura-<concetto>-huge`, entro i 41 caratteri di `MODEL_RE`). Una voce per taglia, ognuna con la sua `size` e il suo `vpt`: il `ModelDirector` dà a una taglia nuova il programma di un'altra voce dello stesso concetto (`shared`, senza chiamate né budget) se è della stessa taglia o se il programma scala (`shareableProgram`: niente `size`, niente `map`); altrimenti lo Scultore lo scrive. Un lotto indossa la voce di prima senza suffisso finché la libreria non ha quella della sua taglia, salvo che sia un programma che scala a un'altra taglia (`Kernel.structureModelFor`): nulla di già scolpito cambia né aspetta una copia.
7. **Più semi**: `ModelInfo.seeds` (1-8) dice quanti semi ha una voce nel mondo (`seedsOf`); lo Scultore lo scrive (4) per le strutture procedurali, ogni lotto ne prende uno (`seedFor`). Le voci senza il campo restano ai semi della loro classe: le case di prima non cambiano seme.

## Alternative scartate

- **La taglia sull'istanza e nella chiave delle forme** (`FormComp.taglia`, `model#seed#taglia#…`): un programma, una voce; ma ogni `forms.ready/get/wait` del kernel e del renderer (una trentina di posti) avrebbe dovuto portarla. Una voce per taglia usa ciò che c'è (`ModelInfo.size`, `vpt`).
- **Un file nuovo per il prompt delle strutture**: un percorso nuovo dell'universo sarebbe nato inglese accanto a `scultore.md` italiano (ADR-0153); il segno nel file che c'è non tocca percorsi né elenchi.
- **Le misure del banco nel validatore**: dipendono da `lab/` e costano secondi a seme; il gioco garantisce che regga e finisca, il banco misura la qualità.
- **Cambiare il modello delle strutture**: non qui. Il confronto con Claude è nell'esito di T156 e in `lab/banco/gemini/`; il modello predefinito costa a chi gioca e lo decide l'autore.

## Conseguenze

- `KERNEL_VERSION` `0.4.1` (nato `0.2.2`, integrato sul contratto 0.4 da T319): gli universi della `0.4` restano buoni; un'Enorme scolpita prima resta com'è.
- Il prompt delle strutture è circa il doppio di quello di prima (17.5 mila caratteri contro 8.5 mila, senza gli esempi della libreria che prima lo accompagnavano): lo paga ogni struttura grande, una volta per concetto (le altre taglie lo condividono).
- Il controllo di un programma procedurale blocca per qualche secondo chi lo fa girare (nel browser, in singola, il thread della pagina), come già una sola esecuzione fino a 8 s.
- Su Gemini 3.8 Flash il prompt regge meno che su Claude: 1 su 7 alla prima, 2 su 7 entro due richieste, contro 7 su 12 e 10 su 12 (`lab/banco/gemini/giudizio.md`); il modello delle strutture resta quello di prima finché l'autore non decide (`docs/pipeline/domande/T156.md`).
- Sicurezza: nessuna superficie nuova (prompt, controlli e voci della libreria; il banco su `agy` è in `lab/` e usa il prompt fidato del banco, mai la coda, ADR-0106).
