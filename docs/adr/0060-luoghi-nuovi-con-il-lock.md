# ADR-0060 — Luoghi nuovi con il lock, a spese di chi esplora

Data: 2026-10-24 · Stato: accettato (task T40 del backlog) · Fase 1 di ADR-0050 (il multiplayer); estende ADR-0058 (il kernel
sul server), ADR-0056 (chi paga e le carte) e ADR-0011 (i piani dei luoghi).

## Contesto
Con T38 il kernel di una partita di molti gira sul server e con T39 i client hanno un kernel specchio che non genera nulla: un
luogo si pianifica già una volta sola (un kernel, `Chunk.developing`, il piano salvato in `maps/`). Restavano tre difetti: il
piano lo pagava sempre `io` (la politica di `payerOf` guarda il viandante che agisce, e lo sviluppo parte fuori da ogni `as`);
le bozze da pianificare erano scelte per vicinanza al solo `io`, e se `io` era in un interno dello studio non si pianificava
più niente per nessuno; N giocatori che esplorano moltiplicano i luoghi nuovi senza un tetto.

## Decisione
1. **Chi ha chiesto il luogo.** Il chunk nasce (`ensureChunk`, dentro `as` per ogni viandante in `updateChunks`) col viandante
   che per primo lo ha voluto vedere: `Chunk.chi`. Se il piano non è nell'archivio, lo paga lui: `chi` va alla chiamata del
   Cartografo (`PlanContext.chi`), alla carta del luogo (`cardPlace` → `sign`) e alla Fucina di ciò che il piano chiede di nuovo
   (`forgeForChunk`). Ciò che resta comune per `payerOf` (oggetti nuovi trovati a terra, modelli dello Scultore, sessioni del
   Concilio) resta comune.
2. **Vicino a chiunque.** `pumpDevelopment` sceglie le bozze più vicine a un viandante qualsiasi fuori dagli interni dello
   studio; senza nessuno nel mondo non pianifica. Il master nello studio, o non collegato (`io` resta nel mondo senza client),
   non ferma il mondo degli altri.
3. **Un limite al minuto.** In multigiocatore al più `ai.placesPerMinute` (predefinito 20, `Kernel.PLACES_PER_MINUTE`) luoghi
   nuovi per minuto di tempo del mondo, per tutto l'universo; un piano già salvato non conta. Oltre, la bozza resta bozza
   (`Chunk.held`, una riga nel registro) e si riprova quando il minuto libera posto. In singola nessun limite.
4. **Il Concilio solo sul server.** Il kernel specchio non ha generazione né Concilio (ADR-0059); sessioni, trame e Fucina
   girano nel kernel del server anche senza master collegato. Gli altri client ricevono il luogo pronto con gli aggiornamenti
   (`luoghi`), alla versione nuova.

## Conseguenze
- Il tempo del limite è quello del mondo (`kernel.time`), non l'orologio: i test lo fanno passare a mano; sul server il mondo
  gira a 60 Hz e i due coincidono.
- Una bozza trattenuta non ha nome né cose finché non tocca a lei: il giocatore vede il terreno, come mentre il Cartografo lavora.
- `tests/explore.test.ts`: due client nello stesso luogo nuovo → un piano, pagato dal primo, il secondo lo riceve pronto; il
  limite al minuto; il master nella Sala del Concilio non ferma i piani di chi esplora.
