# ADR-0004 — Tappeto, spazi di coordinate e corona

Data: 2026-10-19 · Stato: accettato

## Contesto
Il giocatore deve camminare in un mondo che sembra infinito restando sempre al centro di un cerchio
fermo, circondato da una corona immobile che contiene il codice sorgente.

## Decisione
- **Due spazi.** Reale: il cerchio (raggio `R`, default 44) è centrato in (0,0) e non si muove; la
  corona è in spazio reale. Tappeto: terreno, entità e rune. `reale = tappeto − offset`.
- Il giocatore ha la posizione in spazio reale; la sua posizione sul tappeto è `pos + offset`.
- **Il tappeto è un sistema Lua** (`core.carpet`), riscrivibile: ogni tick sposta il giocatore verso
  l'origine di `k = strength · min(1, rate · dt)` e aggiunge lo stesso spostamento all'offset. La
  posizione sul tappeto non cambia; quella reale tende a zero. Camminando a 6 celle/s il ritardo è
  ~1 cella: una piccola crepa osservabile (la runa `x` resta vicina a 0).
- Collisioni: in spazio tappeto dentro il cerchio; la corona è calpestabile; oltre il bordo esterno nulla.
- **Corona**: i file dell'universo, ordinati per percorso, serializzati come
  `§percorso↵contenuto∎`, disposti su anelli concentrici da `R` in su, ogni anello in senso orario
  dall'alto. Lo spessore cresce con la quantità di codice. Ogni cella sa file, riga e colonna.
- Nella corona `E` apre l'editor sul file e sulla riga sotto i piedi.

## Conseguenze
- Il caricamento dei chunk segue la porzione visibile del cerchio (in coordinate tappeto), non solo il giocatore.
- Il tappeto può essere fermato o rotto in molti modi, anche indiretti (`speed` enorme, `strength`
  negativo che spinge fuori, teletrasporto `x = 50`, simbolo `carpet` reciso…).
- Fuori scope ora: spostare i singoli caratteri della corona come rune (oggi si riscrive con l'editor).
