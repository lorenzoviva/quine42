# Il piano della pipeline

> Generato da `node tools/pipeline/pipeline.mjs stato` il 2026-10-30T09:54:32.373Z: non modificarlo a mano,
> la fonte è `docs/plans/backlog.md` (righe `- Pipeline:`).

## Budget

Orchestratore: **gemini** (sotto il 10 % nessun task su di lui; si cambia con `orchestratore <provider>`).

- **claude**: settimana 61 %, 5 ore 0 %, fermo fino a 2026-10-30T12:00:00.000Z (letto da /usage il 2026-10-30T09:54:28.444Z)
  - session, 5h: 0 % residuo, reset 2026-10-30T12:00:00.000Z
  - week (all models), settimana: 61 % residuo, reset 2026-11-05T16:00:00.000Z
- **gemini**: settimana 58 %, 5 ore 73 % (letto da /usage il 2026-10-30T09:51:02.272Z)
  - Gemini Models, settimana: 58 % residuo, reset 2026-11-05T17:37:53.000Z
  - Gemini Models, 5h: 73 % residuo, reset 2026-10-30T13:19:40.000Z
- **argon**: settimana 0 %, 5 ore 0 %, fermo fino a 2026-11-04T18:44:35.000Z (letto da /usage il 2026-10-30T09:54:32.371Z)
  - Gemini 4 Argon, settimana: 0 % residuo, reset 2026-11-04T18:44:35.000Z

## In corso (4)

- **T52** I sotterranei — claude, 3 %
- **T45b** I coefficienti di generazione e la partita «Low Detail» — claude, 6 %
- **T45c** L'eredità dei cloni — claude, 5 %
- **T70** Integrare T53b (più piani) con il salto di T56b — claude, 3 %

## Finiti, da guardare e integrare (`integra Txx`) (3)

- **T53b** Le scale come rampe e le strutture su più piani — ESITO: fatto — le strutture hanno più piani: un pavimento per tratto di pieno, `pos.z` tenuta dal kernel, collisione, `floorAt` e taglio del renderer sul piano in cui si è; test della torre a due piani. — claude, 6 %
- **T54** Le taglie di D&D per strutture e creature — ESITO: fallito (codice 1) — claude, 6 %
- **T45e** I pagamenti con Stripe — ESITO: in attesa — implementata la ricarica crediti con Stripe Checkout, webhook idempotente, blocco anonimi e test headless; in attesa delle chiavi di test dell'autore in docs/pipeline/domande/T45e.md — gemini, 5 %

## Pronti, in ordine di priorità (2)

- **T77** Integrare T45e (i pagamenti con Stripe) nel base 3d — gemini, 1 %
- **T51** Il livello del mare e un motore dell'acqua — claude, 6 %

## Da approvare (provider e stima proposti) (0)

_nessuno_

## Da stimare (manca la riga `- Pipeline:`) (0)

_nessuno_

## Bloccati da dipendenze (3)

- **T57** Le rune come codice: sequenze ordinate, effetti, rune nuove — claude, 8 % (aspetta T51)
- **T45d** La lobby — claude, 5 % (aspetta T45b)
- **T45f** Il server su Google Cloud — claude, 6 % (aspetta T45d)

## In attesa dell'autore (0)

_nessuno_
