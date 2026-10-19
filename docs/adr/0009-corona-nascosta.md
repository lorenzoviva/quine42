# ADR-0009 — La corona è davvero nascosta finché il tappeto ti tiene

Data: 2026-10-20 · Stato: accettato · Modifica: ADR-0004

## Contesto
Nella prima iterazione il cerchio di simulazione era ritagliato e la corona disegnata appena entrava
nell'inquadratura: su schermi grandi si vedeva il bordo nero del mondo, cioè la simulazione si rivelava.
L'autore chiede che, finché il tappeto si muove, la corona non sia visibile in alcun modo.

## Decisione
- `Kernel.coronaRevealed()`: vero solo se il giocatore si trova (in spazio reale) oltre il 45% del
  raggio dal centro, cosa impossibile finché il tappeto lo compensa.
- Finché non è rivelata: nessun ritaglio circolare, nessun bordo, nessuna cella della corona disegnata;
  i chunk del tappeto riempiono tutta la vista (anche oltre il raggio); il tooltip oltre il raggio mostra
  il tappeto, non il codice. La console del kernel (F2) risponde solo dopo la prima uscita (o in dev).
- Una volta rivelata: tornano il cerchio, l'anello tratteggiato vicino al bordo e la corona calpestabile.

## Conseguenze
- La simulazione non ha bordi visibili: l'unico indizio resta il comportamento (la runa `x` vicina a 0,
  i cartelli sempre a 44 passi), come voluto dal flavor.
- Se il giocatore ripristina il tappeto e torna al centro, la corona sparisce di nuovo.
