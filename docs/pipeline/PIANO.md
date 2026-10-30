# Il piano della pipeline

> Generato da `node tools/pipeline/pipeline.mjs stato` il 2026-10-30T02:18:22.324Z: non modificarlo a mano,
> la fonte è `docs/plans/backlog.md` (righe `- Pipeline:`).

## Budget

Orchestratore: **claude** (sotto il 10 % nessun task su di lui; si cambia con `orchestratore <provider>`).

- **claude**: settimana 76 %, 5 ore 64 % (letto da /usage il 2026-10-30T02:18:18.664Z)
  - session, 5h: 64 % residuo, reset 2026-10-30T07:00:00.000Z
  - week (all models), settimana: 76 % residuo, reset 2026-11-05T16:00:00.000Z
- **gemini**: settimana 86 %, 5 ore 100 % (letto da /usage il 2026-10-30T02:18:22.321Z)
  - Gemini Models, settimana: 86 % residuo, reset 2026-11-05T17:37:53.000Z
  - Gemini Models, 5h: 100 % residuo, reset 2026-10-30T07:18:21.000Z
- **argon**: settimana 64 %, 5 ore 100 % (letto da /usage il 2026-10-30T02:18:22.321Z)
  - Gemini 4 Argon, settimana: 64 % residuo, reset 2026-11-04T18:44:35.000Z

## In corso (2)

- **T53b** Le scale come rampe e le strutture su più piani — claude, 6 %
- **T56b** Il salto, e le cose che chiudono i sentieri — claude, 4 %

## Finiti, da guardare e integrare (`integra Txx`) (1)

- **T64** Le varianti precalcolate dei modelli pesanti — ESITO: fatto — implementata cache su due livelli (in memoria e IndexedDB) per le varianti e animazioni dei modelli pesanti con precaricamento di 4 semi per i modelli di scaffale — gemini, 5 %

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
