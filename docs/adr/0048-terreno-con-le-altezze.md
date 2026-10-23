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
   passa nel chunk accanto può scendere di un gradino.
4. **Il kernel** dà `groundAt(x, y)` (altezza del suolo, in caselle) e `floorAt` lo comprende: ciò su cui si sta è il
   suolo, o il pavimento di un modello posato sul suolo sotto il suo centro.
5. **Il renderer** disegna ogni casella come una colonna alta quanto il suo livello, con i fianchi (il colore del terreno
   più scuro; terra verso l'acqua) dove il vicino è più basso; muri, porte, alberi, massi, cose, strutture, rune e luci
   stanno sul suolo; i corpi salgono e scendono i gradini in un attimo (`climb`); la camera guarda il viandante alla sua
   altezza; il mouse sceglie la casella con un raggio che incontra il suolo dove atterra (qualche iterazione).

## Conseguenze
- La corona e lo studio restano piani a y = 0; la simulazione sta un poco più su (il livello più basso è 0) e il taglio
  al cerchio la mostra come un altopiano.
- Le strutture stanno sul suolo sotto il loro centro: sotto un lotto il terreno può variare di mezza casella e
  affiorare o lasciare un vuoto. Spianare i lotti è il task T17 (che può anche unire l'acqua fra i chunk).
- `Relief` costa ~0,45 s una volta per universo (al primo `groundAt`), poi è una lettura di due tabelle.
- Il programma del rilievo è nell'universo: il Concilio potrà un giorno scriverne un altro; per ora nessun agente lo fa.
