# Il piano della pipeline

> Generato da `node tools/pipeline/pipeline.mjs stato` il 2026-11-19T14:31:51.242Z: non modificarlo a mano,
> la fonte è `docs/plans/backlog.md` (righe `- Pipeline:`).

## Budget

Orchestratore: **orchestrator** (sotto il 10 % nessun task su di lui; si cambia con `orchestratore <provider>`).

- **claude** (Opus 5.5): settimana 5 %, 5 ore 51 %; tetto 3, slot 3 (task in programma 2), esaurimento previsto mai a questo ritmo, reset 2026-11-19T16:00:00.000Z (letto da /usage il 2026-11-19T14:27:06.968Z)
  - session, 5h: 51 % residuo, reset 2026-11-19T17:30:00.000Z
  - week (all models), settimana: 5 % residuo, reset 2026-11-19T16:00:00.000Z
- **gemini** (Gemini 3.8 Flash): settimana 97 %, 5 ore 91 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2027-01-10T20:17:17.486Z, reset 2026-11-26T12:30:10.000Z (letto da /usage il 2026-11-19T14:28:19.254Z)
  - Gemini Models, settimana: 97 % residuo, reset 2026-11-26T12:30:10.000Z
  - Gemini Models, 5h: 91 % residuo, reset 2026-11-19T17:30:10.000Z
- **argon** (Gemini 4 Argon): settimana 83 %, 5 ore 83 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2026-11-27T11:32:53.018Z, reset 2026-11-26T12:22:46.000Z (letto da /usage il 2026-11-19T14:28:19.254Z)
  - Gemini 4 Argon, settimana: 83 % residuo, reset 2026-11-26T12:22:46.000Z
- **fable** (Fable 5.2): settimana 5 %, 5 ore 51 %, sospeso; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2026-11-19T20:51:22.261Z, reset 2026-11-19T16:00:00.000Z (letto da /usage il 2026-11-19T14:28:16.660Z)
  - session, 5h: 51 % residuo, reset 2026-11-19T17:30:00.000Z
  - week (all models), settimana: 5 % residuo, reset 2026-11-19T16:00:00.000Z
  - week (Fable), settimana: 74 % residuo, reset 2026-11-19T16:00:00.000Z
- **sonnet** (Sonnet 5.5): settimana 5 %, 5 ore 51 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2026-11-19T18:14:07.139Z, reset 2026-11-19T16:00:00.000Z (letto da /usage il 2026-11-19T14:28:16.660Z)
  - session, 5h: 51 % residuo, reset 2026-11-19T17:30:00.000Z
  - week (all models), settimana: 5 % residuo, reset 2026-11-19T16:00:00.000Z
- **haiku** (Haiku 5.5): settimana 5 %, 5 ore 51 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2026-11-19T18:14:07.139Z, reset 2026-11-19T16:00:00.000Z (letto da /usage il 2026-11-19T14:28:16.660Z)
  - session, 5h: 51 % residuo, reset 2026-11-19T17:30:00.000Z
  - week (all models), settimana: 5 % residuo, reset 2026-11-19T16:00:00.000Z
- **agy-opus** (Opus 5.5 (agy)): settimana 100 %, 5 ore 100 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-11-26T14:28:19.000Z (letto da /usage il 2026-11-19T14:28:19.254Z)
  - Claude and GPT models, settimana: 100 % residuo, reset 2026-11-26T14:28:19.000Z
  - Claude and GPT models, 5h: 100 % residuo, reset 2026-11-19T19:28:19.000Z
- **agy-sonnet** (Sonnet 5.5 (agy)): settimana 100 %, 5 ore 100 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-11-26T14:28:19.000Z (letto da /usage il 2026-11-19T14:28:19.254Z)
  - Claude and GPT models, settimana: 100 % residuo, reset 2026-11-26T14:28:19.000Z
  - Claude and GPT models, 5h: 100 % residuo, reset 2026-11-19T19:28:19.000Z
- **hydrogen** (Gemini 4 Hydrogen): settimana 97 %, 5 ore 91 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2027-01-10T18:37:34.332Z, reset 2026-11-26T12:30:10.000Z (letto da /usage il 2026-11-19T14:28:19.254Z)
  - Gemini Models, settimana: 97 % residuo, reset 2026-11-26T12:30:10.000Z
  - Gemini Models, 5h: 91 % residuo, reset 2026-11-19T17:30:10.000Z
- **orchestrator** (Orchestrator (Argon)): settimana 83 %, 5 ore 91 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2026-11-27T11:32:53.018Z, reset 2026-11-26T12:22:46.000Z (letto da /usage il 2026-11-19T14:28:19.254Z)
  - Gemini Models, settimana: 97 % residuo, reset 2026-11-26T12:30:10.000Z
  - Gemini Models, 5h: 91 % residuo, reset 2026-11-19T17:30:10.000Z
  - Gemini 4 Argon, settimana: 83 % residuo, reset 2026-11-26T12:22:46.000Z

## In corso (1)

- **T435** sidera: perché la Piazza dei Viadotti (0,0) non ha lotti per le sue due strutture, e riparazione — claude (Opus 5.5), sforzo high, 2 %

## Finiti, da guardare e integrare (`integra Txx`) (0)

_nessuno_

## Pronti, in ordine di priorità (1)

- **T436** neapolis: ambienti riscritti dal Cartografo per portare le 4 strutture a 16 vpx e figura di persona del tema — claude (Opus 5.5), sforzo high, 3 %

## Da approvare (provider e stima proposti) (1)

- **T369** (dopo) Un endpoint compatibile per modelli locali su RunPod o Vast.ai — claude (Opus 5.5), sforzo high, 4 %

## Da stimare (manca la riga `- Pipeline:`) (0)

_nessuno_

## Bloccati da dipendenze (2)

- **T401** Il kernel 0.9.0 con il tag — claude (Opus 5.5), sforzo medium, 1 % (aspetta T45f, T237)
- **T237** La guida dei beta tester, in due file — claude (Opus 5.5), 2 % (aspetta T45f)

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
