# Il piano della pipeline

> Generato da `node tools/pipeline/pipeline.mjs stato` il 2026-10-30T13:39:17.934Z: non modificarlo a mano,
> la fonte è `docs/plans/backlog.md` (righe `- Pipeline:`).

## Budget

Orchestratore: **gemini** (sotto il 10 % nessun task su di lui; si cambia con `orchestratore <provider>`).

- **claude**: settimana 9 %, 5 ore 0 %, fermo fino a 2026-10-30T16:59:00.000Z (letto da /usage il 2026-10-30T13:34:20.765Z)
  - session, 5h: 0 % residuo, reset 2026-10-30T16:59:00.000Z
  - week (all models), settimana: 55 % residuo, reset 2026-11-05T15:59:00.000Z
- **gemini**: settimana 53 %, 5 ore 93 % (letto da /usage il 2026-10-30T13:39:02.260Z)
  - Gemini Models, settimana: 53 % residuo, reset 2026-11-05T17:37:53.000Z
  - Gemini Models, 5h: 93 % residuo, reset 2026-10-30T18:19:40.000Z
- **argon**: settimana 0 %, 5 ore 0 %, fermo fino a 2026-11-04T18:44:35.000Z (letto da /usage il 2026-10-30T13:38:00.588Z)
  - Gemini 4 Argon, settimana: 0 % residuo, reset 2026-11-04T18:44:35.000Z

## In corso (3)

- **T52** I sotterranei — claude, 3 %
- **T45b** I coefficienti di generazione e la partita «Low Detail» — claude, 6 %
- **T70** Integrare T53b (più piani) con il salto di T56b — claude, 3 %

## Finiti, da guardare e integrare (`integra Txx`) (4)

- **T53b** Le scale come rampe e le strutture su più piani — ESITO: fatto — le strutture hanno più piani: un pavimento per tratto di pieno, `pos.z` tenuta dal kernel, collisione, `floorAt` e taglio del renderer sul piano in cui si è; test della torre a due piani. — claude, 6 %
- **T54** Le taglie di D&D per strutture e creature — ESITO: fallito (codice 1) — claude, 6 %
- **T45c** L'eredità dei cloni — ESITO: fatto — catena `origini` nelle carte, quote di eredità per utilizzo misurate dal cambio del contenuto (ADR-0081); 8 test della suite ancora in timeout per il carico della macchina, già sul commit di partenza per `wanderers` e `watch`, gli altri tre file non confrontati — claude, 5 %
- **T78** Integrare T45c (l'eredità dei cloni) nel base 3d — ESITO: fatto — eseguito merge di task/T45c con ADR rinumerato in 0084, typecheck e test dell'eredità/clone/cards/credits passati (23/23) e aggiornato backlog.md — gemini, 2 %

## Pronti, in ordine di priorità (1)

- **T51** Il livello del mare e un motore dell'acqua — claude, 6 %

## Da approvare (provider e stima proposti) (0)

_nessuno_

## Da stimare (manca la riga `- Pipeline:`) (0)

_nessuno_

## Bloccati da dipendenze (3)

- **T57** Le rune come codice: sequenze ordinate, effetti, rune nuove — claude, 8 % (aspetta T51)
- **T45d** La lobby — claude, 5 % (aspetta T45b)
- **T45f** Il server su Google Cloud — claude, 6 % (aspetta T45d)

## In attesa dell'autore (1)

- **T45e** I pagamenti con Stripe — claude, 5 %
