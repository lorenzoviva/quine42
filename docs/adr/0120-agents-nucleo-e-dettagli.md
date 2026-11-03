# ADR-0120 — `AGENTS.md` è il nucleo, i sottosistemi stanno in `docs/architettura-dettagli.md`

Data: 2026-11-03 · Stato: accettato · Riferimenti: ADR-0072 (la pipeline), ADR-0119 (il contesto dei task)

## Contesto

`AGENTS.md` era arrivato a 724 righe e 95 KB. Ogni agente e l'orchestratore lo caricano al primo turno, anche per un task che tocca
un solo sottosistema; la metà del file descriveva un meccanismo alla volta (le stanze della corona, il rilievo, l'acqua, Stripe…).

## Decisione

- `AGENTS.md` resta l'unica fonte di verità e il nucleo: visione, regole inviolabili, stack in breve, comandi, struttura, tabella del Concilio,
  un indice dei sottosistemi con una riga e un rimando ciascuno, manifest, API Lua, protocollo delle sessioni, convenzioni.
- `docs/architettura-dettagli.md` tiene il resto, alla lettera: si legge la sezione dell'area che il task tocca. Ogni sezione ha un'ancora stabile
  (`#corona`, `#convalida-browser`…) e l'indice in testa dice i suoi file sorgente.
- Le regole inviolabili non si spostano mai. Un sottosistema nuovo o cambiato si descrive nei dettagli, con una riga nell'indice di `AGENTS.md`.
- Una decisione architetturale resta registrata in un ADR nello stesso commit; se cambia una regola, in `AGENTS.md`.

## Conseguenze

- Il nucleo è sui 37 KB. L'obiettivo iniziale (meno di 160 righe, ~2.500 token) non è raggiungibile tenendo per intero regole, comandi,
  struttura e protocollo: da soli valgono quasi 27 KB. Per scendere ancora bisognerebbe spostare anche una di queste parti.
- Chi lavora su un sottosistema deve seguire il rimando: l'indice lo dice in testa.
- Il censimento del glossario legge anche i dettagli (`tools/glossario/glossario.mjs`).
