# ADR-0027 — Studi neon-punk, sala del Concilio, atlante navigabile

Data: 2026-10-20 · Stato: accettato; estende ADR-0022

## Contesto
L'autore vuole nella sala del Concilio tutti i membri in cerchio attorno a un tavolo rotondo moderno con
uno schermo circolare al centro e un universo in movimento; un teletrasporto alle spalle di ognuno verso
la sua sala, e in ogni sala uno per tornare; uno schermo della storia al posto dei tavoli; un'atmosfera
futuristica, neon punk, con una personalità per ogni sala; nella sala del Cartografo l'atlante,
navigabile, con le zone non generate o parzialmente generate, senza attivare la generazione.

## Decisione
- **Sala del Concilio**: tavolo rotondo (ellisse solida) con lo schermo circolare e una galassia disegnata
  che gira; i sette membri (Narratore, Cartografo, Artista, Fisico, Ingegnere, Arbitro, Referente) seduti
  ai loro posti; alle spalle di ognuno un **teletrasporto** verso la sua sala (Studio dei Personaggi,
  Studio del Cartografo, Galleria, Magazzino degli Oggetti, Sala Sistemi, Direzione; il Referente verso il
  viale). Ogni altra sala ha un teletrasporto per la Sala del Concilio.
- **Schermi della storia** al posto delle scrivanie: le ultime modifiche della sala scorrono; davanti, le
  postazioni della squadra. `E` apre la bacheca.
- **Neon punk**: pavimento scuro con griglia luminosa, strisce neon nel colore della sala, scaffali
  olografici, porte e scale al neon, campus esterno con torri scure dai bordi luminosi; ogni sala ha il
  suo motivo (pioggia di codice nei Sistemi, bussola nel Cartografo, macchie di colore nella Galleria,
  orbite negli Oggetti, scansioni nei Personaggi, raggi in Direzione).
- **Atlante navigabile** (`ui/atlas.ts`, `kernel.atlasView`, `GET /api/universe/<n>/maps`): ogni luogo mai
  progettato (nome, ambiente), i luoghi solo abbozzati, le regioni, la propria posizione; trascinamento,
  frecce, zoom. Guardare non genera nulla. Nello studio non si caricano luoghi del mondo.
