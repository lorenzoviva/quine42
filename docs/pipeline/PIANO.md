# Il piano della pipeline

> Generato da `node tools/pipeline/pipeline.mjs stato` il 2026-11-26T17:10:23.826Z: non modificarlo a mano,
> la fonte è `docs/plans/backlog.md` (righe `- Pipeline:`).

## Budget

Orchestratore: **claude** (sotto il 2 % nessun task su di lui; si cambia con `orchestratore <provider>`).

- **claude** (Opus 5.5): settimana 99 %, 5 ore 90 %; tetto 3, slot 3 (task in programma 4), esaurimento previsto mai a questo ritmo, reset 2026-12-03T15:59:00.000Z (letto da /usage il 2026-11-26T17:09:17.211Z)
  - session, 5h: 90 % residuo, reset 2026-11-26T21:59:00.000Z
  - week (all models), settimana: 99 % residuo, reset 2026-12-03T15:59:00.000Z
- **gemini** (Gemini 3.8 Flash): settimana 100 %, 5 ore 100 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-12-03T17:09:20.000Z (letto da /usage il 2026-11-26T17:09:20.220Z)
  - Gemini Models, settimana: 100 % residuo, reset 2026-12-03T17:09:20.000Z
  - Gemini Models, 5h: 100 % residuo, reset 2026-11-26T22:09:20.000Z
- **argon** (Gemini 4 Argon): settimana 100 %, 5 ore 100 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-11-30T16:58:23.000Z (letto da /usage il 2026-11-23T16:58:23.479Z)
  - Gemini 4 Argon, settimana: 100 % residuo, reset 2026-11-30T16:58:23.000Z
- **fable** (Fable 5.2): settimana 99 %, 5 ore 90 %, sospeso; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-12-03T15:59:00.000Z (letto da /usage il 2026-11-26T17:09:17.211Z)
  - session, 5h: 90 % residuo, reset 2026-11-26T21:59:00.000Z
  - week (all models), settimana: 99 % residuo, reset 2026-12-03T15:59:00.000Z
  - week (Fable), settimana: 100 % residuo, reset 2026-12-03T16:00:00.000Z
- **sonnet** (Sonnet 5.5): settimana 99 %, 5 ore 90 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-12-03T15:59:00.000Z (letto da /usage il 2026-11-26T17:09:17.211Z)
  - session, 5h: 90 % residuo, reset 2026-11-26T21:59:00.000Z
  - week (all models), settimana: 99 % residuo, reset 2026-12-03T15:59:00.000Z
- **haiku** (Haiku 5.5): settimana 99 %, 5 ore 90 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-12-03T15:59:00.000Z (letto da /usage il 2026-11-26T17:09:17.211Z)
  - session, 5h: 90 % residuo, reset 2026-11-26T21:59:00.000Z
  - week (all models), settimana: 99 % residuo, reset 2026-12-03T15:59:00.000Z
- **agy-opus** (Opus 5.5 (agy)): settimana 100 %, 5 ore 100 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset ? (letto da /usage il 2026-11-26T17:09:20.220Z)
  - Claude and GPT models, settimana: 100 % residuo, reset 1970-01-01T00:00:00.000Z
  - Claude and GPT models, 5h: 100 % residuo, reset 1970-01-01T00:00:00.000Z
- **agy-sonnet** (Sonnet 5.5 (agy)): settimana 100 %, 5 ore 100 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset ? (letto da /usage il 2026-11-26T17:09:20.220Z)
  - Claude and GPT models, settimana: 100 % residuo, reset 1970-01-01T00:00:00.000Z
  - Claude and GPT models, 5h: 100 % residuo, reset 1970-01-01T00:00:00.000Z
- **hydrogen** (Gemini 4 Hydrogen): settimana 100 %, 5 ore 100 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-12-03T17:09:20.000Z (letto da /usage il 2026-11-26T17:09:20.220Z)
  - Gemini Models, settimana: 100 % residuo, reset 2026-12-03T17:09:20.000Z
  - Gemini Models, 5h: 100 % residuo, reset 2026-11-26T22:09:20.000Z
- **orchestrator** (Orchestrator (Argon)): settimana 100 %, 5 ore 100 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-12-03T17:09:20.000Z (letto da /usage il 2026-11-26T17:09:20.220Z)
  - Gemini Models, settimana: 100 % residuo, reset 2026-12-03T17:09:20.000Z
  - Gemini Models, 5h: 100 % residuo, reset 2026-11-26T22:09:20.000Z
- **neon** (Gemini 4 Neon): settimana 100 %, 5 ore 100 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-12-03T17:09:20.000Z (letto da /usage il 2026-11-26T17:09:20.220Z)
  - Gemini Models, settimana: 100 % residuo, reset 2026-12-03T17:09:20.000Z
  - Gemini Models, 5h: 100 % residuo, reset 2026-11-26T22:09:20.000Z

## In corso (1)

- **T507** Verifica nel browser del fondale di T480 — claude (Opus 5.5), sforzo medium, 2 %

## Finiti, da guardare e integrare (`integra Txx`) (0)

_nessuno_

## Pronti, in ordine di priorità (2)

- **T481** R5 · Immergersi (riga 8 di T459) — claude (Opus 5.5), sforzo extra, 5 %
- **T483** A1 · L'acqua che scorre (riga 10 di T459) — claude (Opus 5.5), sforzo extra, 5 %

## Da approvare (provider e stima proposti) (1)

- **T369** (dopo) Un endpoint compatibile per modelli locali su RunPod o Vast.ai — claude (Opus 5.5), sforzo high, 4 %

## Da stimare (manca la riga `- Pipeline:`) (0)

_nessuno_

## Bloccati da dipendenze (5)

- **T401** Il kernel 0.9.0 con il tag — claude (Opus 5.5), sforzo medium, 1 % (aspetta T45f, T237)
- **T237** La guida dei beta tester, in due file — claude (Opus 5.5), 2 % (aspetta T45f)
- **T444** P7 · Affondare e relitti — claude (Opus 5.5), sforzo high, 3 % (aspetta T185)
- **T450** S6 · Lo spazio nel Concilio — claude (Opus 5.5), sforzo high, 3 % (aspetta T185)
- **T485** A3 · L'acqua a schermo sulla GPU (riga 12 di T459) — claude (Opus 5.5), sforzo extra, 4 % (aspetta T483)

## In attesa dell'autore (10)

- **T45f** Il server su Google Cloud — claude (Opus 5.5), 6 %
- **T185** Generare gli universi spazio, pirati, cowboy — claude (Opus 5.5), 2 %
- **T235** Showcase: carte famose e universi più giocati
- **T239** Quattro lingue: censimento e progetto
- **T240** Il piano di lancio: concorrenti, punti di forza, Boa Lodger
- **T245g** Il Narratore scrive mestieri e imprese — claude (Opus 5.5), 10 %
- **T245h** I bivi degli NPC — claude (Opus 5.5), 10 %
- **T245i** Vite lunghe — claude (Opus 5.5), 10 %
- **T266** Un'altra tornata di rinomine — claude (Opus 5.5), 5 %
- **T287** La veste del sito: si decide dopo il giro di open beta
