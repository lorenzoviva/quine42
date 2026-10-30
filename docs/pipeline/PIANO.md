# Il piano della pipeline

> Generato da `node tools/pipeline/pipeline.mjs stato` il 2026-10-30T23:23:24.189Z: non modificarlo a mano,
> la fonte è `docs/plans/backlog.md` (righe `- Pipeline:`).

## Budget

Orchestratore: **claude** (sotto il 10 % nessun task su di lui; si cambia con `orchestratore <provider>`).

- **claude**: settimana 44 %, 5 ore 43 %; tetto 1, slot 0 (task in programma 5), esaurimento previsto 2026-11-01T10:12:04.620Z, reset 2026-11-05T15:59:00.000Z (letto da /usage il 2026-10-30T23:19:18.818Z)
  - session, 5h: 43 % residuo, reset 2026-10-31T02:59:00.000Z
  - week (all models), settimana: 44 % residuo, reset 2026-11-05T15:59:00.000Z
- **gemini**: settimana 29 %, 5 ore 95 %; tetto 1, slot 0 (task in programma 0), esaurimento previsto 2026-11-03T16:24:53.443Z, reset 2026-11-05T17:37:53.000Z (letto da /usage il 2026-10-30T23:20:21.660Z)
  - Gemini Models, settimana: 29 % residuo, reset 2026-11-05T17:37:53.000Z
  - Gemini Models, 5h: 95 % residuo, reset 2026-10-31T00:14:46.000Z
- **argon**: settimana 0 %, 5 ore 0 %, fermo fino a 2026-11-04T18:44:35.000Z; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-11-04T18:44:35.000Z (letto da /usage il 2026-10-30T23:22:24.174Z)
  - Gemini 4 Argon, settimana: 0 % residuo, reset 2026-11-04T18:44:35.000Z

## In corso (2)

- **T52** I sotterranei — claude, 3 %
- **T85** Spegnere la pipeline in modo sicuro — claude, 3 %

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

## Bloccati da dipendenze (3)

- **T57** Le rune come codice: sequenze ordinate, effetti, rune nuove — claude, 8 % (aspetta T51)
- **T86** Tracciare tutte le conversazioni in corso, anche quelle di agy e dell'orchestratore — claude, 3 % (aspetta T85)
- **T88** Spendere i crediti che avanzano generando l'universo con gli abbonamenti — claude, 4 % (aspetta T85)

## In attesa dell'autore (1)

- **T45e** I pagamenti con Stripe — claude, 5 %
