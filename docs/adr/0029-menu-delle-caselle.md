# ADR-0029 — Menu contestuale delle caselle

Data: 2026-10-20 · Stato: accettato; estende ADR-0019

## Contesto
L'autore vuole che ogni casella abbia un menu di azioni con «Altro…», e che vi si aggiungano le azioni
dell'oggetto o dell'NPC che ci sta sopra.

## Decisione
- `E` (o il clic destro sulla casella, entro 2.6 caselle) apre `kernel.tileMenu(col, row, entità?)`:
  prima le azioni dell'entità (`e:`), poi quelle della casella (`t:`), infine `t:altro`. Raccogliere da
  terra resta immediato.
- Le azioni libere su una casella vanno al Narratore come le altre (soggetto `tile`); quelle che il
  giudizio rende ripetibili si **imparano sul terreno** (`TileDef.actions` in `world.terrain`), così la
  prossima casella dello stesso tipo le offre.

## Conseguenze
- Tutto il mondo diventa interagibile senza moduli nuovi; il Concilio impara per tipo di casella.
