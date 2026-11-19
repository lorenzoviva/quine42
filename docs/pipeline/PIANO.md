# Il piano della pipeline

> Generato da `node tools/pipeline/pipeline.mjs stato` il 2026-11-19T14:13:25.915Z: non modificarlo a mano,
> la fonte è `docs/plans/backlog.md` (righe `- Pipeline:`).

## Budget

Orchestratore: **orchestrator** (sotto il 10 % nessun task su di lui; si cambia con `orchestratore <provider>`).

- **claude** (Opus 5.5): settimana 21 %, 5 ore 90 %; tetto 3, slot 3 (task in programma 3), esaurimento previsto mai a questo ritmo, reset 2026-11-19T16:00:00.000Z (letto da /usage il 2026-11-19T15:55:00.000Z)
  - session, 5h: 90 % residuo, reset 2026-11-19T17:30:00.000Z
  - week (all models), settimana: 21 % residuo, reset 2026-11-19T16:00:00.000Z
- **gemini** (Gemini 3.8 Flash): settimana 98 %, 5 ore 92 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2027-02-06T05:19:59.920Z, reset 2026-11-26T12:30:10.000Z (letto da /usage il 2026-11-19T14:12:25.120Z)
  - Gemini Models, settimana: 98 % residuo, reset 2026-11-26T12:30:10.000Z
  - Gemini Models, 5h: 92 % residuo, reset 2026-11-19T17:30:10.000Z
- **argon** (Gemini 4 Argon): settimana 84 %, 5 ore 84 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2026-11-28T00:07:45.228Z, reset 2026-11-26T12:22:46.000Z (letto da /usage il 2026-11-19T14:12:25.120Z)
  - Gemini 4 Argon, settimana: 84 % residuo, reset 2026-11-26T12:22:46.000Z
- **fable** (Fable 5.2): settimana 5 %, 5 ore 57 %, sospeso; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2026-11-19T20:34:02.936Z, reset 2026-11-19T16:00:00.000Z (letto da /usage il 2026-11-19T14:12:22.153Z)
  - session, 5h: 57 % residuo, reset 2026-11-19T17:30:00.000Z
  - week (all models), settimana: 5 % residuo, reset 2026-11-19T16:00:00.000Z
  - week (Fable), settimana: 74 % residuo, reset 2026-11-19T16:00:00.000Z
- **sonnet** (Sonnet 5.5): settimana 5 %, 5 ore 57 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2026-11-19T17:57:22.786Z, reset 2026-11-19T16:00:00.000Z (letto da /usage il 2026-11-19T14:12:22.153Z)
  - session, 5h: 57 % residuo, reset 2026-11-19T17:30:00.000Z
  - week (all models), settimana: 5 % residuo, reset 2026-11-19T16:00:00.000Z
- **haiku** (Haiku 5.5): settimana 5 %, 5 ore 57 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2026-11-19T17:57:22.786Z, reset 2026-11-19T16:00:00.000Z (letto da /usage il 2026-11-19T14:12:22.153Z)
  - session, 5h: 57 % residuo, reset 2026-11-19T17:30:00.000Z
  - week (all models), settimana: 5 % residuo, reset 2026-11-19T16:00:00.000Z
- **agy-opus** (Opus 5.5 (agy)): settimana 100 %, 5 ore 100 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-11-26T14:12:25.000Z (letto da /usage il 2026-11-19T14:12:25.120Z)
  - Claude and GPT models, settimana: 100 % residuo, reset 2026-11-26T14:12:25.000Z
  - Claude and GPT models, 5h: 100 % residuo, reset 2026-11-19T19:12:25.000Z
- **agy-sonnet** (Sonnet 5.5 (agy)): settimana 100 %, 5 ore 100 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-11-26T14:12:25.000Z (letto da /usage il 2026-11-19T14:12:25.120Z)
  - Claude and GPT models, settimana: 100 % residuo, reset 2026-11-26T14:12:25.000Z
  - Claude and GPT models, 5h: 100 % residuo, reset 2026-11-19T19:12:25.000Z
- **hydrogen** (Gemini 4 Hydrogen): settimana 98 %, 5 ore 92 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2027-02-06T02:48:52.666Z, reset 2026-11-26T12:30:10.000Z (letto da /usage il 2026-11-19T14:12:25.120Z)
  - Gemini Models, settimana: 98 % residuo, reset 2026-11-26T12:30:10.000Z
  - Gemini Models, 5h: 92 % residuo, reset 2026-11-19T17:30:10.000Z
- **orchestrator** (Orchestrator (Argon)): settimana 84 %, 5 ore 92 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2026-11-28T00:07:45.228Z, reset 2026-11-26T12:22:46.000Z (letto da /usage il 2026-11-19T14:12:25.120Z)
  - Gemini Models, settimana: 98 % residuo, reset 2026-11-26T12:30:10.000Z
  - Gemini Models, 5h: 92 % residuo, reset 2026-11-19T17:30:10.000Z
  - Gemini 4 Argon, settimana: 84 % residuo, reset 2026-11-26T12:22:46.000Z

## In corso (1)

- **T434** Lo Scultore delle strutture: merli e feritoie solo sugli edifici fortificati, il forte come metro di ricchezza e non di forma — claude (Opus 5.5), sforzo high, 2 %

## Finiti, da guardare e integrare (`integra Txx`) (0)

_nessuno_

## Pronti, in ordine di priorità (1)

- **T435** sidera: perché la Piazza dei Viadotti (0,0) non ha lotti per le sue due strutture, e riparazione — claude (Opus 5.5), sforzo high, 2 %

## Da approvare (provider e stima proposti) (1)

- **T369** (dopo) Un endpoint compatibile per modelli locali su RunPod o Vast.ai — claude (Opus 5.5), sforzo high, 4 %

## Da stimare (manca la riga `- Pipeline:`) (0)

_nessuno_

## Bloccati da dipendenze (3)

- **T401** Il kernel 0.9.0 con il tag — claude (Opus 5.5), sforzo medium, 1 % (aspetta T45f, T237)
- **T237** La guida dei beta tester, in due file — claude (Opus 5.5), 2 % (aspetta T45f)
- **T436** neapolis: ambienti riscritti dal Cartografo per portare le 4 strutture a 16 vpx e figura di persona del tema — claude (Opus 5.5), sforzo high, 3 % (aspetta T434)

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
