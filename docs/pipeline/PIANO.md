# Il piano della pipeline

> Generato da `node tools/pipeline/pipeline.mjs stato` il 2026-11-06T20:12:22.927Z: non modificarlo a mano,
> la fonte è `docs/plans/backlog.md` (righe `- Pipeline:`).

## Budget

Orchestratore: **gemini** (sotto il 10 % nessun task su di lui; si cambia con `orchestratore <provider>`).

- **claude** (Opus 5.5): settimana 60 %, 5 ore 6 %; tetto 3, slot 1 (task in programma 18), esaurimento previsto 2026-11-08T14:19:58.356Z, reset 2026-11-12T16:00:00.000Z (letto da /usage il 2026-11-06T20:10:19.582Z)
  - session, 5h: 6 % residuo, reset 2026-11-06T22:00:00.000Z
  - week (all models), settimana: 60 % residuo, reset 2026-11-12T16:00:00.000Z
- **gemini** (Gemini 3.8 Flash): settimana 86 %, 5 ore 70 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2026-11-13T14:52:25.181Z, reset 2026-11-12T17:37:53.000Z (letto da /usage il 2026-11-06T20:08:11.948Z)
  - Gemini Models, settimana: 86 % residuo, reset 2026-11-12T17:37:53.000Z
  - Gemini Models, 5h: 70 % residuo, reset 2026-11-06T23:14:39.000Z
- **argon** (Gemini 4 Argon): settimana 0 %, 5 ore 0 %, fermo fino a 2026-11-11T18:44:35.000Z; tetto 0, slot 0 (task in programma 0), esaurimento previsto 2026-11-06T20:11:22.485Z, reset 2026-11-11T18:44:35.000Z (letto da /usage il 2026-11-06T20:11:22.472Z)
  - Gemini 4 Argon, settimana: 0 % residuo, reset 2026-11-11T18:44:35.000Z
- **fable** (Fable 5.1): settimana 60 %, 5 ore 6 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2026-11-08T14:17:17.211Z, reset 2026-11-12T16:00:00.000Z (letto da /usage il 2026-11-06T20:08:32.545Z)
  - session, 5h: 6 % residuo, reset 2026-11-06T22:00:00.000Z
  - week (all models), settimana: 60 % residuo, reset 2026-11-12T16:00:00.000Z
  - week (Fable), settimana: 100 % residuo, reset 2026-11-12T16:00:00.000Z
- **sonnet** (Sonnet 5.5): settimana 60 %, 5 ore 6 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2026-11-08T14:25:11.212Z, reset 2026-11-12T16:00:00.000Z (letto da /usage il 2026-11-06T20:08:32.545Z)
  - session, 5h: 6 % residuo, reset 2026-11-06T22:00:00.000Z
  - week (all models), settimana: 60 % residuo, reset 2026-11-12T16:00:00.000Z
- **haiku** (Haiku 5.5): settimana 60 %, 5 ore 6 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2026-11-08T14:25:11.212Z, reset 2026-11-12T16:00:00.000Z (letto da /usage il 2026-11-06T20:08:32.545Z)
  - session, 5h: 6 % residuo, reset 2026-11-06T22:00:00.000Z
  - week (all models), settimana: 60 % residuo, reset 2026-11-12T16:00:00.000Z
- **agy-opus** (Opus 5.5 (agy)): settimana 100 %, 5 ore 100 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-11-13T20:11:22.000Z (letto da /usage il 2026-11-06T20:11:22.472Z)
  - Claude and GPT models, settimana: 100 % residuo, reset 2026-11-13T20:11:22.000Z
  - Claude and GPT models, 5h: 100 % residuo, reset 2026-11-07T01:11:22.000Z
- **agy-sonnet** (Sonnet 5.5 (agy)): settimana 100 %, 5 ore 100 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-11-13T20:11:22.000Z (letto da /usage il 2026-11-06T20:11:22.472Z)
  - Claude and GPT models, settimana: 100 % residuo, reset 2026-11-13T20:11:22.000Z
  - Claude and GPT models, 5h: 100 % residuo, reset 2026-11-07T01:11:22.000Z

## In corso (0)

_nessuno_

## Finiti, da guardare e integrare (`integra Txx`) (1)

- **T308b** L'inglese come lingua interna: il filo e Lua (contratto 0.5) — ESITO: fatto — contratto 0.5.0 e migrazione 0.4→0.5 (ADR-0161): protocollo in inglese client e server insieme; componenti e campi per componente (`COMPONENT_FIELDS`; `fino` → `expires`, non `until` che in Lua è riservato); `world.venture`/`venture_bring`, evento `death`, chiave `deposit:`; `luaFor0_5` porta il Lua del Concilio e ripara il codice dell'Ingegnere fino a T310; voci aggiunte alla tabella (compiti, impresa_posto, concetto/classe/taglia, stati velocita/peso/luce, salto da/a/alto, cantiere titolo/stato/manca/squadra, morto, fame/sete); test nuovo `migration-0.5.test.ts`; suite (2533 passati) e typecheck verdi, build ok. Non coperti: `worldwire.ts` e rotte HTTP restano italiani; `sicurezza:prove` non lanciato; conflitti attesi con T319 all'integrazione. Sicurezza: nessuna superficie nuova (cambiano i nomi, non ciò che il server accetta né ciò che esce). — claude (Opus 5.5), sforzo extra, 3 %

## Pronti, in ordine di priorità (12)

- **T328** Integrare T308b nel base, che ha T319 e T156 — claude (Opus 5.5), sforzo high, 3 %
- **T325** Dove Jev ci fa risparmiare ancora: i casi d'uso di TypeSafe sul nostro progetto, con la spesa di oggi misurata — claude (Opus 5.5), sforzo max, 6 %
- **T324** Jev con le immagini: le foto dei modelli giudicate come l'Artista, contro Flash-Lite — claude (Opus 5.5), sforzo extra, 4 %
- **T315** La veste futuristica mista: il palco 3D e il labirinto MarkovJunior 2D insieme — claude (Opus 5.5), sforzo max, 4 %
- **T321** Lo Scultore su Gemini 3.8 Flash: il prompt adattato e un giro sul banco — claude (Opus 5.5), sforzo high, 4 %
- **T281** I punti di `placeInside` che il kernel trova bloccati dentro le strutture — claude (Opus 5.5), sforzo extra, 4 %
- **T303** La misura vera dello Scenografo, con gli abbonamenti — claude (Opus 5.5), sforzo high, 3 %
- **T288** Ciò che il viandante impugna si vede addosso: armi e attrezzi — claude (Opus 5.5), sforzo max, 4 %
- **T294** I tre laboratori per i giocatori: forkare e modificare — claude (Opus 5.5), sforzo high, 4 %
- **T295** Portare le carte in un universo nuovo, prima della Genesi — claude (Opus 5.5), sforzo max, 4 %
- **T242** Il rapporto aureo nei prompt dello Scultore e dell'Artista — claude (Opus 5.5), 1 %
- **T88** Spendere i crediti che avanzano con la generazione differita — claude (Opus 5.5), 4 %

## Da approvare (provider e stima proposti) (0)

_nessuno_

## Da stimare (manca la riga `- Pipeline:`) (0)

_nessuno_

## Bloccati da dipendenze (8)

- **T233** La landing launcher nel sito — claude (Opus 5.5), 3 % (aspetta T287)
- **T237** La guida dei beta tester, in due file — claude (Opus 5.5), 2 % (aspetta T45f, T294)
- **T289** Vestiti e armature addosso: il banco che decide come — claude (Opus 5.5), sforzo max, 3 % (aspetta T288)
- **T292** Prendere e spostare i mobili (`takeable`) — claude (Opus 5.5), sforzo max, 4 % (aspetta T288)
- **T296** Eliminare la carta problematica — claude (Opus 5.5), sforzo max, 1.5 % (aspetta T295)
- **T309** L'inglese come lingua interna: i commenti di Lua e degli XML — claude (Opus 5.5), sforzo high, 4 % (aspetta T308b, T328)
- **T310** L'inglese come lingua interna: i prompt del Concilio in inglese, il mondo nella lingua del suo universo — claude (Opus 5.5), sforzo extra, 6 % (aspetta T309)
- **T327** L'NPC come oggetto coeso: il comportamento in un modulo solo, dietro una facciata — claude (Opus 5.5), sforzo extra, 6 % (aspetta T308b, T328)

## In attesa dell'autore (14)

- **T45f** Il server su Google Cloud — claude (Opus 5.5), 6 %
- **T153** Gli universi steampunk, moderno e futuristico: leggerli e provarli — claude (Opus 5.5), 2 %
- **T259** Lo Scenografo: progetto e misura degli interni separati dall'edificio — claude (Opus 5.5), 5 %
- **T184** Le ambientazioni spazio, pirati, cowboy — claude (Opus 5.5), 2 %
- **T185** Generare gli universi spazio, pirati, cowboy — claude (Opus 5.5), 2 %
- **T235** Showcase: carte famose e universi più giocati
- **T239** Quattro lingue: censimento e progetto
- **T240** Il piano di lancio: concorrenti, punti di forza, Boa Loger
- **T245g** Il Narratore scrive mestieri e imprese — claude (Opus 5.5), 10 %
- **T245h** I bivi degli NPC — claude (Opus 5.5), 10 %
- **T245i** Vite lunghe — claude (Opus 5.5), 10 %
- **T266** Un'altra tornata di rinomine — claude (Opus 5.5), 5 %
- **T287** La scelta della veste: subito dall'autore, o col voto dei beta tester
- **T290** Vestiti e armature addosso nel gioco
