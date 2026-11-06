# Il piano della pipeline

> Generato da `node tools/pipeline/pipeline.mjs stato` il 2026-11-06T14:54:26.330Z: non modificarlo a mano,
> la fonte è `docs/plans/backlog.md` (righe `- Pipeline:`).

## Budget

Orchestratore: **gemini** (sotto il 10 % nessun task su di lui; si cambia con `orchestratore <provider>`).

- **claude** (Opus 5.5): settimana 66 %, 5 ore 8 %; tetto 3, slot 1 (task in programma 18), esaurimento previsto 2026-11-08T11:14:54.257Z, reset 2026-11-12T15:59:00.000Z (letto da /usage il 2026-11-06T14:51:15.305Z)
  - session, 5h: 8 % residuo, reset 2026-11-06T16:59:00.000Z
  - week (all models), settimana: 66 % residuo, reset 2026-11-12T15:59:00.000Z
- **gemini** (Gemini 3.8 Flash): settimana 95 %, 5 ore 84 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2026-11-23T08:39:31.737Z, reset 2026-11-12T17:37:53.000Z (letto da /usage il 2026-11-06T14:51:47.133Z)
  - Gemini Models, settimana: 95 % residuo, reset 2026-11-12T17:37:53.000Z
  - Gemini Models, 5h: 84 % residuo, reset 2026-11-06T16:54:54.000Z
- **argon** (Gemini 4 Argon): settimana 0 %, 5 ore 0 %, fermo fino a 2026-11-11T18:44:35.000Z; tetto 0, slot 0 (task in programma 0), esaurimento previsto 2026-11-06T14:52:20.288Z, reset 2026-11-11T18:44:35.000Z (letto da /usage il 2026-11-06T14:51:47.133Z)
  - Gemini 4 Argon, settimana: 0 % residuo, reset 2026-11-11T18:44:35.000Z
- **fable** (Fable 5.1): settimana 66 %, 5 ore 8 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2026-11-08T11:14:54.257Z, reset 2026-11-12T15:59:00.000Z (letto da /usage il 2026-11-06T14:54:26.312Z)
  - session, 5h: 8 % residuo, reset 2026-11-06T16:59:00.000Z
  - week (all models), settimana: 66 % residuo, reset 2026-11-12T15:59:00.000Z
  - week (Fable), settimana: 100 % residuo, reset 2026-11-12T16:00:00.000Z
- **sonnet** (Sonnet 5.5): settimana 66 %, 5 ore 8 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2026-11-08T11:09:16.959Z, reset 2026-11-12T15:59:00.000Z (letto da /usage il 2026-11-06T14:54:26.312Z)
  - session, 5h: 8 % residuo, reset 2026-11-06T16:59:00.000Z
  - week (all models), settimana: 66 % residuo, reset 2026-11-12T15:59:00.000Z
- **haiku** (Haiku 5.5): settimana 66 %, 5 ore 8 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2026-11-08T11:09:16.959Z, reset 2026-11-12T15:59:00.000Z (letto da /usage il 2026-11-06T14:54:26.312Z)
  - session, 5h: 8 % residuo, reset 2026-11-06T16:59:00.000Z
  - week (all models), settimana: 66 % residuo, reset 2026-11-12T15:59:00.000Z
- **agy-opus** (Opus 5.5 (agy)): settimana 100 %, 5 ore 100 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-11-13T14:51:47.000Z (letto da /usage il 2026-11-06T14:51:47.133Z)
  - Claude and GPT models, settimana: 100 % residuo, reset 2026-11-13T14:51:47.000Z
  - Claude and GPT models, 5h: 100 % residuo, reset 2026-11-06T19:51:47.000Z
- **agy-sonnet** (Sonnet 5.5 (agy)): settimana 100 %, 5 ore 100 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-11-13T14:51:47.000Z (letto da /usage il 2026-11-06T14:51:47.133Z)
  - Claude and GPT models, settimana: 100 % residuo, reset 2026-11-13T14:51:47.000Z
  - Claude and GPT models, 5h: 100 % residuo, reset 2026-11-06T19:51:47.000Z

## In corso (0)

_nessuno_

## Finiti, da guardare e integrare (`integra Txx`) (1)

- **T156** Il prompt nuovo nello Scultore del gioco — ESITO: in attesa — prompt procedurale nello Scultore per `structure` da Grande in su (senza scatola, 4 semi più la taglia successiva, traccia nella seconda richiesta), una voce per taglia che condivide il programma senza chiamate, `ModelInfo.seeds`, ADR-0158, kernel 0.2.2, suite e typecheck verdi; su Gemini 3.8 Flash via agy 1 su 7 alla prima e 2 su 7 entro due richieste contro 7 e 10 su 12 di Claude (alla prima 18 850 di input e 90 mila di output, 0,35 $ a chiamata contro 1,15 $; 13 chiamate, 5,39 $; tre seconde richieste vuote per il tetto di output); Argon non provato per il limite dell'abbonamento; i controlli del kernel non misurano i piani raggiunti; la decisione su modello o prompt è in `docs/pipeline/domande/T156.md`; sicurezza: nessuna superficie nuova. — claude (Opus 5.5), 5 %

## Pronti, in ordine di priorità (6)

- **T319** Integrare T156 nel base, che ha il contratto 0.3 (T307b) — claude (Opus 5.5), sforzo high, 3 %
- **T308b** L'inglese come lingua interna: il filo e Lua (contratto 0.5) — claude (Opus 5.5), sforzo extra, 3 %
- **T315** La veste futuristica mista: il palco 3D e il labirinto MarkovJunior 2D insieme — claude (Opus 5.5), sforzo max, 4 %
- **T281** I punti di `placeInside` che il kernel trova bloccati dentro le strutture — claude (Opus 5.5), sforzo extra, 4 %
- **T288** Ciò che il viandante impugna si vede addosso: armi e attrezzi — claude (Opus 5.5), sforzo max, 4 %
- **T293** Le carte fatte a mano: forma, archivio, rotte, interruttore — claude (Opus 5.5), sforzo max, 3 %

## Da approvare (provider e stima proposti) (0)

_nessuno_

## Da stimare (manca la riga `- Pipeline:`) (0)

_nessuno_

## Bloccati da dipendenze (14)

- **T88** Spendere i crediti che avanzano con la generazione differita — claude (Opus 5.5), 4 % (aspetta T156)
- **T233** La landing launcher nel sito — claude (Opus 5.5), 3 % (aspetta T287)
- **T237** La guida dei beta tester, in due file — claude (Opus 5.5), 2 % (aspetta T45f, T294)
- **T242** Il rapporto aureo nei prompt dello Scultore e dell'Artista — claude (Opus 5.5), 1 % (aspetta T156)
- **T289** Vestiti e armature addosso: il banco che decide come — claude (Opus 5.5), sforzo max, 3 % (aspetta T288)
- **T292** Prendere e spostare i mobili (`takeable`) — claude (Opus 5.5), sforzo max, 4 % (aspetta T288)
- **T294** I tre laboratori per i giocatori: forkare e modificare — claude (Opus 5.5), sforzo high, 4 % (aspetta T293)
- **T295** Portare le carte in un universo nuovo, prima della Genesi — claude (Opus 5.5), sforzo max, 4 % (aspetta T293)
- **T296** Eliminare la carta problematica — claude (Opus 5.5), sforzo max, 1.5 % (aspetta T295)
- **T303** La misura vera dello Scenografo, con gli abbonamenti — claude (Opus 5.5), sforzo high, 3 % (aspetta T156)
- **T309** L'inglese come lingua interna: i commenti di Lua e degli XML — claude (Opus 5.5), sforzo high, 4 % (aspetta T308b)
- **T310** L'inglese come lingua interna: i prompt del Concilio in inglese, il mondo nella lingua del suo universo — claude (Opus 5.5), sforzo extra, 6 % (aspetta T309)
- **T320** Lo Scultore: «almeno due piani raggiungibili a piedi» nei controlli del kernel — claude (Opus 5.5), sforzo high, 4 % (aspetta T319)
- **T321** Lo Scultore su Gemini 3.8 Flash: il prompt adattato e un giro sul banco — claude (Opus 5.5), sforzo high, 4 % (aspetta T320)

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
