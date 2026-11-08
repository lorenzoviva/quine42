# ADR-0175 — MarkovJunior: i simboli sono lettere o `#` e un numero; le cifre da sole non lo sono più (contratto 0.6)

Data: 2026-11-08 · Stato: accettato (task T342 del backlog, step 30) · Riferimenti: l'autore in chat (08/11), ADR-0036 e ADR-0038 (MarkovJunior nel gioco e nel laboratorio), ADR-0041 (ogni aspetto è un programma), ADR-0123 (il suono come programma), ADR-0136 (la versione del kernel), ADR-0142 (il motore non cambia un voxel), ADR-0152 (le migrazioni), ADR-0161 (le carte fatte a mano), ADR-0170 (le carte portate), ADR-0171 (le regole da file e `<import>`), ADR-0173 (l'inferenza), ADR-0174 (`wfc` e `convchain`)

## Contesto

Un simbolo (un colore della griglia) di un programma MarkovJunior era un carattere solo: le 52 lettere e le dieci cifre. Per strutture
ricche (gli edifici procedurali dello Scultore ne usano già una cinquantina, i tileset e i sottoblocchi di T333-T335 ne vogliono di più) sono
troppo pochi. L'autore propone `#` seguito da un numero (`#12`): i simboli diventano illimitati e da qui in poi le cifre stanno solo dopo `#`.

## Decisione

1. **Che cos'è un simbolo** (`src/mj/symbols.ts`): una lettera, oppure `#` e un numero letto avidamente (`#12A` sono due simboli, `#12` e
   `A`; `#1#2` due). Niente zeri davanti (`#07` non è `#7`: un nome solo per simbolo); il numero va da `#0` a `#2047`. **Una cifra da sola
   è un errore del compilatore** col motivo («la cifra "3" da sola non è un simbolo: … (#3)»), anche nel modo che ripara le forme dei
   modelli: il motivo torna all'agente che l'ha scritta (regola 2). Anche `#` senza numero è un errore. I segni di una unione restano
   quelli di prima (`?`, `!`, `~`…), tranne `#`, che ora apre un simbolo numerato.

2. **Ovunque si leggono simboli**: `values` (radice, `map`, `wfc`, tileset, `convolution`), i pattern (`in`/`out` come attributi, come figli,
   dai file di T333), le unioni, `<color symbol>`, `origin`/`ground`/`soil`, `path`, le forme, `field`/`observe` (T334), `wfc`/`convchain`
   con le loro tessere e i campioni (T335), la tinta dei modelli (`models/index.json → tint`). Nei testi di un pattern una riga che comincia
   con `#` **e nessun numero** è una nota; `#12AB` è una riga. Il validatore dei file di regole legge gli stessi simboli. `<sound>` non ha
   simboli nei suoi attributi: le lettere che suonano restano N S A G K H C.

3. **Dentro, un carattere per simbolo.** Il compilatore dà al motore un carattere per simbolo, come prima: una lettera è sé stessa,
   `#0`-`#9` sono le cifre `'0'`-`'9'`, da `#10` in su un carattere dell'area d'uso privato (da U+F000, dopo i simboli privati delle unioni,
   U+E000…). Così un programma di prima, convertito, è **lo stesso programma** per il motore, voce per voce (lo stesso alfabeto, nello
   stesso ordine): la stessa griglia voxel per voxel e lo stesso suono campione per campione (`tests/mj-engine-determinism.test.ts`, con le
   impronte prese prima della conversione). Il motore non cambia. Ciò che mostra un simbolo a una persona lo mostra col suo nome
   (`symbolName`, `showSymbols`): la traccia, i messaggi del compilatore e del motore, le lettere che lo Scultore usa per un'azione,
   l'editor e il SoundLab, che scrive i ritocchi col nome.

4. **Il tetto.** Le celle del motore sono byte: un programma ha al più **255 simboli** oltre la cella vuota (`MAX_SYMBOLS`, `MAX_CODES` =
   256 con l'aria), contati su tutte le sue griglie; oltre, il compilatore lo dice col motivo prima ancora del motore. Il numero di un
   simbolo arriva a `#2047`, ma è un nome: non cambia il tetto. Le carte fatte a mano hanno lo stesso tetto, dal motore vero.

5. **Contratto 0.6 e la migrazione 0.5 → 0.6** (`src/kernel/migrations.ts`). Il senso dei programmi cambia (una cifra non si legge più):
   contratto nuovo, kernel 0.6.0. La migrazione riscrive ogni `models/*.xml` e ogni `models/*.txt` di un universo: ogni cifra da sola
   diventa `#` e la cifra, **solo dove sta un simbolo** (gli attributi elemento per elemento, il testo di `<in>`, `<out>`, `<tile>` e dei file
   di testo; mai `size`, `steps`, `scale`, `at`, il `to` di una `line`, i nomi dei file, delle tessere in una `wfc` a tessere, i numeri); il
   resto del testo resta com'era, carattere per carattere (commenti, spazi, ordine degli attributi). Un'unione che era `#` prende il primo
   segno che il programma non usa (`~ ^ ! $ % @ + = _ ; : ,`). È pura e idempotente: un programma della 0.6 resta com'è (le note restano
   note, i `#12` restano). La tinta dei modelli segue. Le carte fatte a mano della 0.5 passano dalla stessa funzione quando si leggono
   (`portedProgram`, con il contratto nuovo); quelle portate da un universo di prima arrivano da `portedFiles`, che fa la migrazione in
   memoria. I programmi del seme e del laboratorio (anche i modelli originali portati) sono convertiti con la stessa funzione
   (`lab/scripts/mj-simboli.ts`); i registri del banco (richieste e risposte di Gemini, tracce) restano come furono scritti.

6. **Prompt.** Lo Scultore e il Musicista sanno che un simbolo è una lettera o `#` e un numero, e che una cifra da sola non lo è; lo
   scheletro procedurale dello Scultore è convertito. Le unioni con nome di cifra diventano `#1`, `#2`…

## Conseguenze

- Un universo della 0.5 si apre migrato; uno che le migrazioni non portano nell'intervallo resta in sola lettura (ADR-0156).
- Un programma con più di 52 simboli si scrive senza trucchi; uno con più di 255 no, e lo dice.
- Una nota di prima che cominciava con `#` e una cifra (`#1 il tetto`) diventerebbe una riga: nel repository non ce n'erano, e la
  migrazione non tocca le note (riscriverle non sarebbe idempotente).
- Un'unione `#` dentro un file di regole condiviso fra più programmi non si rinomina (il file non sa di chi è): nel repository non ce
  n'erano.
