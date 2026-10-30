# Il piano della pipeline

> Generato da `node tools/pipeline/pipeline.mjs stato` il 2026-10-30T17:56:22.814Z: non modificarlo a mano,
> la fonte è `docs/plans/backlog.md` (righe `- Pipeline:`).

## Budget

Orchestratore: **gemini** (sotto il 10 % nessun task su di lui; si cambia con `orchestratore <provider>`).

- **claude**: settimana 49 %, 5 ore 0 %, fermo fino a 2026-10-30T21:59:00.000Z (letto da /usage il 2026-10-30T17:55:46.060Z)
  - session, 5h: 0 % residuo, reset 2026-10-30T21:59:00.000Z
  - week (all models), settimana: 49 % residuo, reset 2026-11-05T15:59:00.000Z
- **gemini**: settimana 30 %, 5 ore 15 % (letto da /usage il 2026-10-30T17:55:48.576Z)
  - Gemini Models, settimana: 30 % residuo, reset 2026-11-05T17:37:53.000Z
  - Gemini Models, 5h: 15 % residuo, reset 2026-10-30T18:19:40.000Z
- **argon**: settimana 0 %, 5 ore 0 %, fermo fino a 2026-11-04T18:44:35.000Z (letto da /usage il 2026-10-30T17:55:48.576Z)
  - Gemini 4 Argon, settimana: 0 % residuo, reset 2026-11-04T18:44:35.000Z

## In corso (2)

- **T52** I sotterranei — claude, 3 %
- **T83** Il carico della macchina: un solo browser e una sola suite pesante alla volta — claude, 3 %

## Finiti, da guardare e integrare (`integra Txx`) (1)

- **T54** Le taglie di D&D per strutture e creature — ESITO: fallito (codice 1) — claude, 6 %

## Pronti, in ordine di priorità (0)

_nessuno_

## Da approvare (provider e stima proposti) (3)

- **T51** Il livello del mare e un motore dell'acqua — claude, 6 %
- **T45f** Il server su Google Cloud — claude, 6 %
- **T89** La grafica a cartone — claude, 5 %

## Da stimare (manca la riga `- Pipeline:`) (0)

_nessuno_

## Bloccati da dipendenze (5)

- **T57** Le rune come codice: sequenze ordinate, effetti, rune nuove — claude, 8 % (aspetta T51)
- **T84** L'orchestratore parla solo quando serve, e con meno epoche — claude, 3 % (aspetta T83)
- **T85** Spegnere la pipeline in modo sicuro — claude, 3 % (aspetta T84)
- **T86** Tracciare tutte le conversazioni in corso, anche quelle di agy e dell'orchestratore — claude, 3 % (aspetta T85)
- **T88** Spendere i crediti che avanzano generando l'universo con gli abbonamenti — claude, 4 % (aspetta T85)

## In attesa dell'autore (1)

- **T45e** I pagamenti con Stripe — claude, 5 %
