# Il piano della pipeline

> Generato da `node tools/pipeline/pipeline.mjs stato` il 2026-11-10T17:21:55.316Z: non modificarlo a mano,
> la fonte è `docs/plans/backlog.md` (righe `- Pipeline:`).

## Budget

Orchestratore: **gemini** (sotto il 10 % nessun task su di lui; si cambia con `orchestratore <provider>`).

- **claude** (Opus 5.5): settimana 9 %, 5 ore 9 %; tetto 3, slot 1 (task in programma 3), esaurimento previsto 2026-11-11T19:13:05.735Z, reset 2026-11-12T16:00:00.000Z (letto da /usage il 2026-11-10T17:19:45.623Z)
  - week (all models), settimana: 9 % residuo, reset 2026-11-12T16:00:00.000Z
- **gemini** (Gemini 3.8 Flash): settimana 97 %, 5 ore 98 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2027-02-15T13:45:36.636Z, reset 2026-11-15T06:15:36.000Z (letto da /usage il 2026-11-10T17:19:54.105Z)
  - Gemini Models, settimana: 97 % residuo, reset 2026-11-15T06:15:36.000Z
  - Gemini Models, 5h: 98 % residuo, reset 2026-11-10T22:14:42.000Z
- **argon** (Gemini 4 Argon): settimana 100 %, 5 ore 100 %, fermo fino a 2026-11-11T18:44:35.000Z; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-11-17T17:19:49.000Z (letto da /usage il 2026-11-10T17:19:54.105Z)
  - Gemini 4 Argon, settimana: 100 % residuo, reset 2026-11-17T17:19:49.000Z
- **fable** (Fable 5.1): settimana 9 %, 5 ore 9 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2026-11-11T19:13:51.779Z, reset 2026-11-12T16:00:00.000Z (letto da /usage il 2026-11-10T17:19:45.623Z)
  - week (all models), settimana: 9 % residuo, reset 2026-11-12T16:00:00.000Z
  - week (Fable), settimana: 100 % residuo, reset 2026-11-12T16:00:00.000Z
- **sonnet** (Sonnet 5.5): settimana 9 %, 5 ore 9 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2026-11-11T19:13:51.779Z, reset 2026-11-12T16:00:00.000Z (letto da /usage il 2026-11-10T17:19:45.623Z)
  - week (all models), settimana: 9 % residuo, reset 2026-11-12T16:00:00.000Z
- **haiku** (Haiku 5.5): settimana 9 %, 5 ore 9 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2026-11-11T19:13:51.779Z, reset 2026-11-12T16:00:00.000Z (letto da /usage il 2026-11-10T17:19:45.623Z)
  - week (all models), settimana: 9 % residuo, reset 2026-11-12T16:00:00.000Z
- **agy-opus** (Opus 5.5 (agy)): settimana 100 %, 5 ore 100 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-11-17T17:19:49.000Z (letto da /usage il 2026-11-10T17:19:54.105Z)
  - Claude and GPT models, settimana: 100 % residuo, reset 2026-11-17T17:19:49.000Z
  - Claude and GPT models, 5h: 100 % residuo, reset 2026-11-10T22:19:49.000Z
- **agy-sonnet** (Sonnet 5.5 (agy)): settimana 100 %, 5 ore 100 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-11-17T17:19:49.000Z (letto da /usage il 2026-11-10T17:19:54.105Z)
  - Claude and GPT models, settimana: 100 % residuo, reset 2026-11-17T17:19:49.000Z
  - Claude and GPT models, 5h: 100 % residuo, reset 2026-11-10T22:19:49.000Z

## In corso (0)

_nessuno_

## Finiti, da guardare e integrare (`integra Txx`) (0)

_nessuno_

## Pronti, in ordine di priorità (3)

- **T290** Vestiti e armature addosso nel gioco — claude (Opus 5.5), sforzo max, 6 %
- **T346** Strutture MJ: correzione dettagli, separazione animali e campi vari (passo 1 di D48) — claude (Opus 5.5), sforzo high, 5 %
- **T345** La open beta senza pagamenti all'autore: OpenRouter, hosting esterno e self-hosting (studio e ADR proposto) — claude (Opus 5.5), sforzo high, 3 %

## Da approvare (provider e stima proposti) (2)

- **T310b** L'inglese come lingua interna: i nomi dei campi degli schemi, il tipo di legame come id, i valori interni ancora italiani — claude (Opus 5.5), sforzo extra, 6 %
- **T347** La Campagna del Master: spese master, universo privato su invito e direttive del Concilio (studio e ADR proposto) — claude (Opus 5.5), sforzo high, 4 %

## Da stimare (manca la riga `- Pipeline:`) (0)

_nessuno_

## Bloccati da dipendenze (2)

- **T233** La landing launcher nel sito — claude (Opus 5.5), 3 % (aspetta T287)
- **T237** La guida dei beta tester, in due file — claude (Opus 5.5), 2 % (aspetta T45f)

## In attesa dell'autore (16)

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
