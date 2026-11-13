# Il piano della pipeline

> Generato da `node tools/pipeline/pipeline.mjs stato` il 2026-11-13T17:41:42.501Z: non modificarlo a mano,
> la fonte è `docs/plans/backlog.md` (righe `- Pipeline:`).

## Budget

Orchestratore: **argon** (sotto il 10 % nessun task su di lui; si cambia con `orchestratore <provider>`).

- **claude** (Opus 5.5): settimana 62 %, 5 ore 5 %; tetto 3, slot 1 (task in programma 1), esaurimento previsto 2026-11-15T09:44:48.793Z, reset 2026-11-19T16:00:00.000Z (letto da /usage il 2026-11-13T17:41:39.913Z)
  - session, 5h: 5 % residuo, reset 2026-11-13T18:00:00.000Z
  - week (all models), settimana: 62 % residuo, reset 2026-11-19T16:00:00.000Z
- **gemini** (Gemini 3.8 Flash): settimana 98 %, 5 ore 100 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-11-15T06:15:36.000Z (letto da /usage il 2026-11-13T17:41:42.483Z)
  - Gemini Models, settimana: 98 % residuo, reset 2026-11-15T06:15:36.000Z
  - Gemini Models, 5h: 100 % residuo, reset 2026-11-13T22:41:41.000Z
- **argon** (Gemini 4 Argon): settimana 73 %, 5 ore 73 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2026-11-17T00:00:40.812Z, reset 2026-11-17T21:39:05.000Z (letto da /usage il 2026-11-13T17:41:42.483Z)
  - Gemini 4 Argon, settimana: 73 % residuo, reset 2026-11-17T21:39:05.000Z
- **fable** (Fable 5.2): settimana 38 %, 5 ore 5 %; tetto 1, slot 1 (task in programma 1), esaurimento previsto 2026-11-14T14:23:12.508Z, reset 2026-11-19T16:00:00.000Z (letto da /usage il 2026-11-13T17:41:39.913Z)
  - session, 5h: 5 % residuo, reset 2026-11-13T18:00:00.000Z
  - week (all models), settimana: 62 % residuo, reset 2026-11-19T16:00:00.000Z
  - week (Fable), settimana: 38 % residuo, reset 2026-11-19T16:00:00.000Z
- **sonnet** (Sonnet 5.5): settimana 62 %, 5 ore 5 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2026-11-15T09:44:48.793Z, reset 2026-11-19T16:00:00.000Z (letto da /usage il 2026-11-13T17:41:39.913Z)
  - session, 5h: 5 % residuo, reset 2026-11-13T18:00:00.000Z
  - week (all models), settimana: 62 % residuo, reset 2026-11-19T16:00:00.000Z
- **haiku** (Haiku 5.5): settimana 62 %, 5 ore 5 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2026-11-15T09:44:48.793Z, reset 2026-11-19T16:00:00.000Z (letto da /usage il 2026-11-13T17:41:39.913Z)
  - session, 5h: 5 % residuo, reset 2026-11-13T18:00:00.000Z
  - week (all models), settimana: 62 % residuo, reset 2026-11-19T16:00:00.000Z
- **agy-opus** (Opus 5.5 (agy)): settimana 100 %, 5 ore 100 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-11-20T17:41:41.000Z (letto da /usage il 2026-11-13T17:41:42.483Z)
  - Claude and GPT models, settimana: 100 % residuo, reset 2026-11-20T17:41:41.000Z
  - Claude and GPT models, 5h: 100 % residuo, reset 2026-11-13T22:41:41.000Z
- **agy-sonnet** (Sonnet 5.5 (agy)): settimana 100 %, 5 ore 100 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-11-20T17:41:41.000Z (letto da /usage il 2026-11-13T17:41:42.483Z)
  - Claude and GPT models, settimana: 100 % residuo, reset 2026-11-20T17:41:41.000Z
  - Claude and GPT models, 5h: 100 % residuo, reset 2026-11-13T22:41:41.000Z

## In corso (0)

_nessuno_

## Finiti, da guardare e integrare (`integra Txx`) (0)

_nessuno_

## Pronti, in ordine di priorità (2)

- **T347** La Campagna del Master: spese del master, universo privato su invito, ritmo della generazione e direttive al Concilio (studio e ADR proposto) — fable (Fable 5.2), sforzo high, 4 %
- **T352** La stima della lobby con i token misurati — claude (Opus 5.5), sforzo medium, 2 %

## Da approvare (provider e stima proposti) (1)

- **T310b** L'inglese come lingua interna: i nomi dei campi degli schemi, il tipo di legame come id, i valori interni ancora italiani — claude (Opus 5.5), sforzo extra, 6 %

## Da stimare (manca la riga `- Pipeline:`) (1)

- **T360** Nuovi modelli specializzati di Antigravity (`gemini-4-hydrogen` e `Orchestrator`) nella pipeline

## Bloccati da dipendenze (1)

- **T237** La guida dei beta tester, in due file — claude (Opus 5.5), 2 % (aspetta T45f)

## In attesa dell'autore (18)

- **T45f** Il server su Google Cloud — claude (Opus 5.5), 6 %
- **T153** Gli universi steampunk, moderno e futuristico: leggerli e provarli — claude (Opus 5.5), 2 %
- **T259** Lo Scenografo: progetto e misura degli interni separati dall'edificio — claude (Opus 5.5), 5 %
- **T184** Le ambientazioni spazio, pirati, cowboy — claude (Opus 5.5), 2 %
- **T185** Generare gli universi spazio, pirati, cowboy — claude (Opus 5.5), 2 %
- **T235** Showcase: carte famose e universi più giocati
- **T239** Quattro lingue: censimento e progetto
- **T240** Il piano di lancio: concorrenti, punti di forza, Boa Loger
- **T242** Il rapporto aureo nei prompt dello Scultore e dell'Artista — claude (Opus 5.5), 1 %
- **T245g** Il Narratore scrive mestieri e imprese — claude (Opus 5.5), 10 %
- **T245h** I bivi degli NPC — claude (Opus 5.5), 10 %
- **T245i** Vite lunghe — claude (Opus 5.5), 10 %
- **T266** Un'altra tornata di rinomine — claude (Opus 5.5), 5 %
- **T287** La scelta della veste: subito dall'autore, o col voto dei beta tester
- **T303** La misura vera dello Scenografo, con gli abbonamenti — claude (Opus 5.5), sforzo high, 3 %
- **T321** Lo Scultore su Gemini 3.8 Flash: il prompt adattato e un giro sul banco — claude (Opus 5.5), sforzo high, 4 %
- **T355** Il giro su Gemini dello Scultore nuovo, prima di cambiare quello del gioco (passo 3 di D48) — claude (Opus 5.5), sforzo high, 3 %
- **T356** Il tetto dei voxel delle strutture gargantuesche — fable (Fable 5.2), sforzo high, 4 %
