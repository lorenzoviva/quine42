# Il piano della pipeline

> Generato da `node tools/pipeline/pipeline.mjs stato` il 2026-10-31T16:13:29.539Z: non modificarlo a mano,
> la fonte è `docs/plans/backlog.md` (righe `- Pipeline:`).

## Budget

Orchestratore: **claude** (sotto il 10 % nessun task su di lui; si cambia con `orchestratore <provider>`).

- **claude**: settimana 28 %, 5 ore 88 %; tetto 1, slot 1 (task in programma 2), esaurimento previsto 2026-11-02T01:43:47.756Z, reset 2026-11-05T16:00:00.000Z (letto da /usage il 2026-10-31T16:13:27.033Z)
  - session, 5h: 88 % residuo, reset 2026-10-31T20:30:00.000Z
  - week (all models), settimana: 28 % residuo, reset 2026-11-05T16:00:00.000Z
- **gemini**: settimana 25 %, 5 ore 94 %; tetto 1, slot 0 (task in programma 1), esaurimento previsto 2026-11-04T19:24:58.279Z, reset 2026-11-05T17:37:53.000Z (letto da /usage il 2026-10-31T16:10:25.586Z)
  - Gemini Models, settimana: 25 % residuo, reset 2026-11-05T17:37:53.000Z
  - Gemini Models, 5h: 94 % residuo, reset 2026-10-31T16:20:17.000Z
- **argon**: settimana 0 %, 5 ore 0 %, fermo fino a 2026-11-04T18:44:35.000Z; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-11-04T18:44:35.000Z (letto da /usage il 2026-10-31T16:11:34.705Z)
  - Gemini 4 Argon, settimana: 0 % residuo, reset 2026-11-04T18:44:35.000Z

## In corso (0)

_nessuno_

## Finiti, da guardare e integrare (`integra Txx`) (1)

- **T51b** Il motore dell'acqua — ESITO: fatto — automa cellulare dell'acqua (`water.ts`), `kernel.dig`, `scavi`/`acqua` nel piano e nel `PlaceView`, ADR-0094; suite intera non verde (4 test rotti anche sul base, il resto timeout per carico), `water.test.ts` e typecheck verdi — claude, 5 %

## Pronti, in ordine di priorità (3)

- **T96** Mai zero slot per nessun provider — gemini, 3 %
- **T57** Le rune come codice: sequenze ordinate, effetti, rune nuove — claude, 8 %
- **T97** Il sito: progetto, pagine e stile — claude, 5 %

## Da approvare (provider e stima proposti) (3)

- **T45f** Il server su Google Cloud — claude, 6 %
- **T88** Spendere i crediti che avanzano generando l'universo con gli abbonamenti — claude, 4 %
- **T95** Test rossi da soli: explore, partita, subscription — claude, 3 %

## Da stimare (manca la riga `- Pipeline:`) (1)

- **T89a** Cartone: fasce e interruttore

## Bloccati da dipendenze (4)

- **T89b** Cartone: contorni dagli id di cosa e parte (aspetta T89a)
- **T89c** Cartone: luce tinta e prospettiva aerea (aspetta T89a)
- **T89d** Cartone: lo stile nei dati e le foto dei modelli (aspetta T89b)
- **T89e** Cartone: laboratorio, prestazioni, togliere la prova (aspetta T89a)

## In attesa dell'autore (0)

_nessuno_
