# Il piano della pipeline

> Generato da `node tools/pipeline/pipeline.mjs stato` il 2026-11-01T03:42:44.431Z: non modificarlo a mano,
> la fonte è `docs/plans/backlog.md` (righe `- Pipeline:`).

## Budget

Orchestratore: **gemini** (sotto il 10 % nessun task su di lui; si cambia con `orchestratore <provider>`).

- **claude**: settimana 14 %, 5 ore 0 %, fermo fino a 2026-11-01T05:50:00.000Z; tetto 1, slot 1 (task in programma 11), esaurimento previsto 2026-11-01T17:44:00.475Z, reset 2026-11-05T16:00:00.000Z (letto da /usage il 2026-11-01T03:40:43.119Z)
  - session, 5h: 0 % residuo, reset 2026-11-01T05:50:00.000Z
  - week (all models), settimana: 14 % residuo, reset 2026-11-05T16:00:00.000Z
- **gemini**: settimana 9 %, 5 ore 64 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2026-11-01T17:07:31.278Z, reset 2026-11-05T17:37:53.000Z (letto da /usage il 2026-11-01T03:40:37.308Z)
  - Gemini Models, settimana: 9 % residuo, reset 2026-11-05T17:37:53.000Z
  - Gemini Models, 5h: 64 % residuo, reset 2026-11-01T06:01:59.000Z
- **argon**: settimana 0 %, 5 ore 0 %, fermo fino a 2026-11-04T18:44:35.000Z; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-11-04T18:44:35.000Z (letto da /usage il 2026-11-01T03:38:45.670Z)
  - Gemini 4 Argon, settimana: 0 % residuo, reset 2026-11-04T18:44:35.000Z

## In corso (1)

- **T57b** Rune nuove dal Concilio — claude, 5 %

## Finiti, da guardare e integrare (`integra Txx`) (1)

- **T103** Il sito: hub sessioni multigiocatore e creazione nuovo universo — ESITO: fatto — implementato l'hub sessioni multigiocatore con stato live su /api/session e wizard di creazione nuovo universo git — gemini, 4 %

## Pronti, in ordine di priorità (6)

- **T114** Verificare T103 (l'hub sessioni multigiocatore) nel browser e integrare — claude, 3 %
- **T102** Il sito: login e gestione profilo viandante con visualizzatore 3D — claude, 4 %
- **T104** Il sito: area carte collezionabili 3D animate — claude, 5 %
- **T105** Il sito: area pagamenti e cruscotto crediti Stripe — claude, 3 %
- **T106** Tema pop art / retro arcade: applicazione alle interfacce in-game — claude, 4 %
- **T89a** Cartone: fasce e interruttore — claude, 3 %

## Da approvare (provider e stima proposti) (2)

- **T45f** Il server su Google Cloud — claude, 6 %
- **T88** Spendere i crediti che avanzano generando l'universo con gli abbonamenti — claude, 4 %

## Da stimare (manca la riga `- Pipeline:`) (0)

_nessuno_

## Bloccati da dipendenze (4)

- **T89b** Cartone: contorni dagli id di cosa e parte — claude, 6 % (aspetta T89a)
- **T89c** Cartone: luce tinta e prospettiva aerea — claude, 3 % (aspetta T89a)
- **T89d** Cartone: lo stile nei dati e le foto dei modelli — claude, 3 % (aspetta T89b)
- **T89e** Cartone: laboratorio, prestazioni, togliere la prova — claude, 4 % (aspetta T89a)

## In attesa dell'autore (0)

_nessuno_
