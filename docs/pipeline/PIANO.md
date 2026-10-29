# Il piano della pipeline

> Generato da `node tools/pipeline/pipeline.mjs stato` il 2026-10-29T21:59:58.303Z: non modificarlo a mano,
> la fonte è `docs/plans/backlog.md` (righe `- Pipeline:`).

## Budget

Orchestratore: **claude** (sotto il 10 % nessun task su di lui; si cambia con `orchestratore <provider>`).

- **claude**: settimana 81 %, 5 ore 13 % (letto da /usage il 2026-10-29T21:59:54.436Z)
  - session, 5h: 13 % residuo, reset 2026-10-30T01:59:00.000Z
  - week (all models), settimana: 81 % residuo, reset 2026-11-05T15:59:00.000Z
- **gemini**: settimana 87 %, 5 ore 55 % (letto da /usage il 2026-10-29T21:59:57.777Z)
  - Gemini Models, settimana: 87 % residuo, reset 2026-11-05T17:37:53.000Z
  - Gemini Models, 5h: 55 % residuo, reset 2026-10-29T22:37:53.000Z
- **argon**: settimana 64 %, 5 ore 100 % (letto da /usage il 2026-10-29T21:59:57.777Z)
  - Gemini 4 Argon, settimana: 64 % residuo, reset 2026-11-04T18:44:35.000Z

## In corso (3)

- **T53b** Le scale come rampe e le strutture su più piani — claude, 6 %
- **T56b** Il salto, e le cose che chiudono i sentieri — claude, 4 %
- **T64** Le varianti precalcolate dei modelli pesanti — gemini, 5 %

## Finiti, da guardare e integrare (`integra Txx`) (0)

_nessuno_

## Pronti, in ordine di priorità (0)

_nessuno_

## Da approvare (provider e stima proposti) (6)

- **T44b** L'account e l'autenticazione — claude, 5 %
- **T44c** Correzioni dalla verifica nel browser di T44a e T43c — claude, 3 %
- **T45a** I crediti e le spese comuni — claude, 5 %
- **T45b** I coefficienti di generazione e la partita «Low Detail» — claude, 6 %
- **T45c** L'eredità dei cloni — claude, 5 %
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
