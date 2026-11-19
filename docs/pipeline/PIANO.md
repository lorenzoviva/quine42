# Il piano della pipeline

> Generato da `node tools/pipeline/pipeline.mjs stato` il 2026-11-19T00:53:35.780Z: non modificarlo a mano,
> la fonte è `docs/plans/backlog.md` (righe `- Pipeline:`).

## Budget

Orchestratore: **claude** (sotto il 10 % nessun task su di lui; si cambia con `orchestratore <provider>`).

- **claude** (Opus 5.5): settimana 13 %, 5 ore 54 %; tetto 3, slot 1 (task in programma 5), esaurimento previsto mai a questo ritmo, reset 2026-11-19T16:00:00.000Z (letto da /usage il 2026-11-19T00:53:33.095Z)
  - session, 5h: 54 % residuo, reset 2026-11-19T03:00:00.000Z
  - week (all models), settimana: 13 % residuo, reset 2026-11-19T16:00:00.000Z
- **sonnet** (Sonnet 5.5): settimana 13 %, 5 ore 54 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-11-19T16:00:00.000Z (letto da /usage il 2026-11-19T00:53:33.095Z)
  - session, 5h: 54 % residuo, reset 2026-11-19T03:00:00.000Z
  - week (all models), settimana: 13 % residuo, reset 2026-11-19T16:00:00.000Z
- **haiku** (Haiku 5.5): settimana 13 %, 5 ore 54 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-11-19T16:00:00.000Z (letto da /usage il 2026-11-19T00:53:33.095Z)
  - session, 5h: 54 % residuo, reset 2026-11-19T03:00:00.000Z
  - week (all models), settimana: 13 % residuo, reset 2026-11-19T16:00:00.000Z
- **fable** (Fable 5.2): settimana 13 %, 5 ore 54 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-11-19T16:00:00.000Z (letto da /usage il 2026-11-19T00:53:33.095Z)
  - session, 5h: 54 % residuo, reset 2026-11-19T03:00:00.000Z
  - week (all models), settimana: 13 % residuo, reset 2026-11-19T16:00:00.000Z
  - week (Fable), settimana: 74 % residuo, reset 2026-11-19T15:59:00.000Z
- **gemini** (Gemini 3.8 Flash): settimana 100 %, 5 ore 100 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-11-26T00:53:35.000Z (letto da /usage il 2026-11-19T00:53:35.739Z)
  - Gemini Models, settimana: 100 % residuo, reset 2026-11-26T00:53:35.000Z
  - Gemini Models, 5h: 100 % residuo, reset 2026-11-19T05:53:35.000Z
- **argon** (Gemini 4 Argon): settimana 100 %, 5 ore 100 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-11-26T00:53:35.000Z (letto da /usage il 2026-11-19T00:53:35.739Z)
  - Gemini 4 Argon, settimana: 100 % residuo, reset 2026-11-26T00:53:35.000Z
- **agy-opus** (Opus 5.5 (agy)): settimana 100 %, 5 ore 100 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-11-26T00:53:35.000Z (letto da /usage il 2026-11-19T00:53:35.739Z)
  - Claude and GPT models, settimana: 100 % residuo, reset 2026-11-26T00:53:35.000Z
  - Claude and GPT models, 5h: 100 % residuo, reset 2026-11-19T05:53:35.000Z
- **agy-sonnet** (Sonnet 5.5 (agy)): settimana 100 %, 5 ore 100 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-11-26T00:53:35.000Z (letto da /usage il 2026-11-19T00:53:35.739Z)
  - Claude and GPT models, settimana: 100 % residuo, reset 2026-11-26T00:53:35.000Z
  - Claude and GPT models, 5h: 100 % residuo, reset 2026-11-19T05:53:35.000Z
- **hydrogen** (Gemini 4 Hydrogen): settimana 100 %, 5 ore 100 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-11-26T00:53:35.000Z (letto da /usage il 2026-11-19T00:53:35.739Z)
  - Gemini Models, settimana: 100 % residuo, reset 2026-11-26T00:53:35.000Z
  - Gemini Models, 5h: 100 % residuo, reset 2026-11-19T05:53:35.000Z
- **orchestrator** (Orchestrator (Argon)): settimana 100 %, 5 ore 100 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-11-26T00:53:35.000Z (letto da /usage il 2026-11-19T00:53:35.739Z)
  - Gemini Models, settimana: 100 % residuo, reset 2026-11-26T00:53:35.000Z
  - Gemini Models, 5h: 100 % residuo, reset 2026-11-19T05:53:35.000Z
  - Gemini 4 Argon, settimana: 100 % residuo, reset 2026-11-26T00:53:35.000Z

## In corso (0)

_nessuno_

## Finiti, da guardare e integrare (`integra Txx`) (0)

_nessuno_

## Pronti, in ordine di priorità (5)

- **T429** Il letto: l'impalcatura di una casella, la coperta di una e mezza — claude (Opus 5.5), sforzo high, 2 %
- **T430** L'aspetto di base degli oggetti: una stella che pulsa al posto della pozione — claude (Opus 5.5), sforzo high, 2 %
- **T431** Interni: i mobili in diagonale chiudono la via porta→scale; hover ed `E` non sanno del piano — claude (Opus 5.5), sforzo high, 3 %
- **T184** Le ambientazioni spazio, pirati, cowboy — claude (Opus 5.5), sforzo high, 3 %
- **T432** La specifica del kernel per l'acqua dei Pirati e per lo spazio — claude (Opus 5.5), sforzo xhigh, 6 %

## Da approvare (provider e stima proposti) (1)

- **T369** (dopo) Un endpoint compatibile per modelli locali su RunPod o Vast.ai — claude (Opus 5.5), sforzo high, 4 %

## Da stimare (manca la riga `- Pipeline:`) (0)

_nessuno_

## Bloccati da dipendenze (2)

- **T401** Il kernel 0.9.0 con il tag — claude (Opus 5.5), sforzo medium, 1 % (aspetta T45f, T153, T237)
- **T237** La guida dei beta tester, in due file — claude (Opus 5.5), 2 % (aspetta T45f)

## In attesa dell'autore (11)

- **T45f** Il server su Google Cloud — claude (Opus 5.5), 6 %
- **T153** Gli universi steampunk, moderno e futuristico: leggerli e provarli — claude (Opus 5.5), 2 %
- **T185** Generare gli universi spazio, pirati, cowboy — claude (Opus 5.5), 2 %
- **T235** Showcase: carte famose e universi più giocati
- **T239** Quattro lingue: censimento e progetto
- **T240** Il piano di lancio: concorrenti, punti di forza, Boa Lodger
- **T245g** Il Narratore scrive mestieri e imprese — claude (Opus 5.5), 10 %
- **T245h** I bivi degli NPC — claude (Opus 5.5), 10 %
- **T245i** Vite lunghe — claude (Opus 5.5), 10 %
- **T266** Un'altra tornata di rinomine — claude (Opus 5.5), 5 %
- **T287** La veste del sito: si decide dopo il giro di open beta
