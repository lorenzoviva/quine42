# Il piano della pipeline

> Generato da `node tools/pipeline/pipeline.mjs stato` il 2026-10-30T13:09:32.848Z: non modificarlo a mano,
> la fonte è `docs/plans/backlog.md` (righe `- Pipeline:`).

## Budget

Orchestratore: **gemini** (sotto il 10 % nessun task su di lui; si cambia con `orchestratore <provider>`).

- **claude**: settimana 55 %, 5 ore 7 % (letto da /usage il 2026-10-30T13:09:29.902Z)
  - session, 5h: 7 % residuo, reset 2026-10-30T17:00:00.000Z
  - week (all models), settimana: 55 % residuo, reset 2026-11-05T16:00:00.000Z
- **gemini**: settimana 56 %, 5 ore 63 % (letto da /usage il 2026-10-30T13:09:32.846Z)
  - Gemini Models, settimana: 56 % residuo, reset 2026-11-05T17:37:53.000Z
  - Gemini Models, 5h: 63 % residuo, reset 2026-10-30T13:19:40.000Z
- **argon**: settimana 0 %, 5 ore 0 %, fermo fino a 2026-11-04T18:44:35.000Z (letto da /usage il 2026-10-30T13:09:32.846Z)
  - Gemini 4 Argon, settimana: 0 % residuo, reset 2026-11-04T18:44:35.000Z

## In corso (4)

- **T52** I sotterranei — claude, 3 %
- **T45b** I coefficienti di generazione e la partita «Low Detail» — claude, 6 %
- **T70** Integrare T53b (più piani) con il salto di T56b — claude, 3 %
- **T78** Integrare T45c (l'eredità dei cloni) nel base 3d — claude, 2 %

## Finiti, da guardare e integrare (`integra Txx`) (3)

- **T53b** Le scale come rampe e le strutture su più piani — ESITO: fatto — le strutture hanno più piani: un pavimento per tratto di pieno, `pos.z` tenuta dal kernel, collisione, `floorAt` e taglio del renderer sul piano in cui si è; test della torre a due piani. — claude, 6 %
- **T54** Le taglie di D&D per strutture e creature — ESITO: fallito (codice 1) — claude, 6 %
- **T45c** L'eredità dei cloni — ESITO: fatto — catena `origini` nelle carte, quote di eredità per utilizzo misurate dal cambio del contenuto (ADR-0081); 8 test della suite ancora in timeout per il carico della macchina, già sul commit di partenza per `wanderers` e `watch`, gli altri tre file non confrontati — claude, 5 %

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
