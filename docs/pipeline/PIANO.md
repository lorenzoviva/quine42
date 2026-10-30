# Il piano della pipeline

> Generato da `node tools/pipeline/pipeline.mjs stato` il 2026-10-30T02:54:33.669Z: non modificarlo a mano,
> la fonte è `docs/plans/backlog.md` (righe `- Pipeline:`).

## Budget

Orchestratore: **claude** (sotto il 10 % nessun task su di lui; si cambia con `orchestratore <provider>`).

- **claude**: settimana 72 %, 5 ore 37 % (letto da /usage il 2026-10-30T02:53:40.530Z)
  - session, 5h: 37 % residuo, reset 2026-10-30T07:00:00.000Z
  - week (all models), settimana: 72 % residuo, reset 2026-11-05T16:00:00.000Z
- **gemini**: settimana 86 %, 5 ore 100 % (letto da /usage il 2026-10-30T02:53:43.805Z)
  - Gemini Models, settimana: 86 % residuo, reset 2026-11-05T17:37:53.000Z
  - Gemini Models, 5h: 100 % residuo, reset 2026-10-30T07:53:43.000Z
- **argon**: settimana 64 %, 5 ore 100 % (letto da /usage il 2026-10-30T02:53:43.805Z)
  - Gemini 4 Argon, settimana: 64 % residuo, reset 2026-11-04T18:44:35.000Z

## In corso (0)

_nessuno_

## Finiti, da guardare e integrare (`integra Txx`) (1)

- **T53b** Le scale come rampe e le strutture su più piani — ESITO: fatto — le strutture hanno più piani: un pavimento per tratto di pieno, `pos.z` tenuta dal kernel, collisione, `floorAt` e taglio del renderer sul piano in cui si è; test della torre a due piani. — claude, 6 %

## Pronti, in ordine di priorità (1)

- **T70** Integrare T53b (più piani) con il salto di T56b — claude, 3 %

## Da approvare (provider e stima proposti) (7)

- **T44b** L'account e l'autenticazione — claude, 5 %
- **T44c** Correzioni dalla verifica nel browser di T44a e T43c — claude, 3 %
- **T45a** I crediti e le spese comuni — claude, 5 %
- **T45b** I coefficienti di generazione e la partita «Low Detail» — claude, 6 %
- **T45c** L'eredità dei cloni — claude, 5 %
- **T69** L'interfaccia web della pipeline — argon, 6 %
- **T68b** Il processo che serve la coda con le CLI — claude, 4 %

## Da stimare (manca la riga `- Pipeline:`) (0)

_nessuno_

## Bloccati da dipendenze (5)

- **T57** Le rune come codice: sequenze ordinate, effetti, rune nuove — claude, 8 % (aspetta T51)
- **T45d** La lobby — claude, 5 % (aspetta T45a, T45b, T44b)
- **T45e** I pagamenti con Stripe — claude, 5 % (aspetta T45a, T44b)
- **T45f** Il server su Google Cloud — claude, 6 % (aspetta T44b, T45d)
- **T68c** Gli abbonamenti nel gioco — claude, 3 % (aspetta T68b)

## In attesa dell'autore (3)

- **T51** Il livello del mare e un motore dell'acqua — claude, 6 %
- **T52** I sotterranei
- **T54** Le taglie di D&D per strutture e creature
