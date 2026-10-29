# ADR-0048 — Il terreno con le altezze (Hills)

Data: 2026-10-23 · Stato: accettato (task T16 del backlog) · Modifica ADR-0040 (il mondo in 3D: terreno piano).

## Contesto
Il terreno era piano: ogni casella a y = 0, tranne l'acqua un poco più bassa. L'autore voleva variazioni di altezza,
partendo dall'esempio 3D `Hills` di MarkovJunior (in `lab/mjx/official/`, 40×40×12): l'aria cresce dall'alto dentro la
terra (`one AB → AA`), una `convolution` la leviga, e la cima della terra in ogni colonna è un'altezza. Ma una griglia
di MarkovJunior ha dei bordi e il mondo no; e la regola 10 (ciò che sembra invalicabile lo è) vale anche per i dislivelli.

## Decisione
1. **Un campo di altezze a scala di casella** nel kernel (`src/kernel/relief.ts`, `Relief`): `Hills` gira due volte, su
   scatole di lati primi fra loro (64 e 45, profonde 12, i passi di crescita scalati con l'area), con semi presi dal seme
   dell'universo. Ogni risultato è letto come una piastrella che si ripete; le sue cuciture si rammendano (`mend`:
   nessun vicino, anche attraverso il bordo, sta più di un livello sopra). Il livello di una casella è la somma delle
   due (meno il minimo): si ripete solo ogni 2880 caselle, è deterministico per seme e coordinate, uguale in Node e nel
   browser. Il programma è quello dell'universo se c'è (`world/rilievo.xml`), altrimenti `Hills` invariato; se non si
   compila è un guasto (`universe:relief`) e vale `Hills`.
2. **Solo estetiche, mai ostacoli**: un livello è un quarto di casella; due vicini differiscono di due livelli al più
   (mezza casella), un gradino che un corpo sale. Niente pendenze invalicabili: non servono controlli di connettività
   nuovi, e nulla sembra invalicabile senza esserlo. Il dislivello del mondo è di 7 livelli circa (1,75 caselle).
3. **L'acqua è piana**: ogni specchio d'acqua di un chunk (caselle liquide unite per i lati, solo quelle del chunk) sta
   al livello più basso fra le sue (`waterLevels`, in cache per chunk finché le caselle non cambiano). Dove un fiume
   passa nel chunk accanto può scendere di un gradino. *Superato da T51a (punto 7): lo specchio è piano per intero,
   attraverso i chunk.*
4. **Il kernel** dà `groundAt(x, y)` (altezza del suolo, in caselle) e `floorAt` lo comprende: ciò su cui si sta è il
   suolo, o il pavimento di un modello posato sul suolo sotto il suo centro.
5. **Il renderer** disegna ogni casella come una colonna alta quanto il suo livello, con i fianchi (il colore del terreno
   più scuro; terra verso l'acqua) dove il vicino è più basso; muri, porte, alberi, massi, cose, strutture, rune e luci
   stanno sul suolo; i corpi salgono e scendono i gradini in un attimo (`climb`); la camera guarda il viandante alla sua
   altezza; il mouse sceglie la casella con un raggio che incontra il suolo dove atterra (qualche iterazione).
6. **I lotti sono piani** (T17): il livello di ogni casella di un chunk pianificato è `chunkLevels` (`relief.ts`):
   l'acqua come al punto 3; ogni lotto (il rettangolo di un edificio del piano, dove sta la sua struttura) è piano alla
   mediana dei suoi livelli, o il più vicino che il bordo del chunk e i lotti già posati permettono (due livelli per
   casella di distanza); prima i lotti più grandi, poi un anello di una casella attorno a ciascuno, piano dove si può.
   Il resto del chunk si piega (ogni casella libera entro due livelli dai vicini di terra, finché non si ferma); il bordo
   del chunk resta il rilievo, così i chunk si incontrano come prima. Non si salva nulla di nuovo: i lotti vengono dal
   piano, che è già salvato, e il risultato è deterministico; `groundAt` lo tiene in cache per chunk finché caselle,
   lotti e rilievo restano gli stessi. Dentro un lotto il sentiero che entra dalla porta è piano con lui.
7. **Il livello del mare e gli specchi interi** (T51a, 29/10/2026): il mondo ha un livello del mare,
   `universe.json → rilievo.mare` o, senza, quello che dà il rilievo (`Relief.sea`: il livello sotto cui, o a cui, sta
   il 10 % delle caselle del mondo, `SEA_SHARE`, contato esatto dalle due scatole). Prima dei lotti il kernel calcola un
   **campo dei livelli di tutto il mondo caricato** (`worldLevels` in `relief.ts`, `kernel.levelsOf`): il rilievo, mai sotto il
   mare; il mare (l'acqua dove la bozza dice `o`, e tutta l'acqua che la tocca) al livello del mare; ogni altro specchio
   piano **per intero**, attraverso i chunk, al più basso delle sue caselle e **mai sopra la terra che lo circonda**; la terra
   scende verso l'acqua di due livelli a casella al più (le sponde: si sale sempre). È il campo più alto sotto il rilievo
   che tiene questi vincoli (un cammino minimo: due livelli per ogni casella di terra in cui si entra, zero per l'acqua,
   con una coda a secchi), quindi lo stesso in qualunque ordine arrivino i chunk; lo specchio si segue fin dove arriva il
   mondo caricato. `chunkLevels` posa poi i lotti su questo campo (il bordo del chunk tiene il campo, non più il rilievo
   nudo) e la terra libera non scende sotto l'acqua accanto. Il campo si rifà quando un chunk arriva, se ne va o cambia le
   caselle; un chunk le cui caselle non cambiano ma i livelli sì (lo specchio si è allungato oltre) alza `Chunk.levels`, che
   entra nella chiave delle mesh del renderer. Il client sottile riceve con ogni luogo le caselle di mare della bozza
   (`PlaceView.mare`) e calcola il campo sui luoghi che ha; la miniatura dell'Ufficio dei luoghi usa il luogo da solo (la
   stessa che sia caricato o no). Non si salva nulla. Il motore dell'acqua che scorre (T51b) è a parte.

## Conseguenze
- La corona e lo studio restano piani a y = 0; la simulazione sta un poco più su (il livello più basso è 0) e il taglio
  al cerchio la mostra come un altopiano.
- Le strutture stanno sul suolo sotto il loro centro, che dopo T17 è il piano del loro lotto: niente terreno che affiora
  dal pavimento né vuoti sotto i muri. Dove un pendio è ripido quanto il rilievo permette (due livelli a casella fino al
  bordo) un lotto piano non entra senza un gradino: il lotto vince e resta un gradino più alto (solo estetico, punto 2).
- L'acqua che passa da un chunk all'altro è allo stesso livello (T51a); un lago che continua oltre il mondo caricato
  può abbassarsi quando arriva il chunk dove scende di più: il campo dipende da ciò che è caricato, non dall'ordine.
- Le terre sotto il mare salgono al mare (pianure costiere); il campo costa pochi millisecondi per decine di chunk.
- `Relief` costa ~0,45 s una volta per universo (al primo `groundAt`), poi è una lettura di due tabelle.
- Il programma del rilievo è nell'universo: il Concilio potrà un giorno scriverne un altro; per ora nessun agente lo fa.
