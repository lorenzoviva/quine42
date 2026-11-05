# Il piano della pipeline

> Generato da `node tools/pipeline/pipeline.mjs stato` il 2026-11-05T01:24:47.211Z: non modificarlo a mano,
> la fonte è `docs/plans/backlog.md` (righe `- Pipeline:`).

## Budget

Orchestratore: **argon** (sotto il 10 % nessun task su di lui; si cambia con `orchestratore <provider>`).

- **claude**: settimana 9 %, 5 ore 100 %; tetto 3, slot 1 (task in programma 14), esaurimento previsto 2026-11-05T13:53:46.462Z, reset 2026-11-05T16:00:00.000Z (letto da /usage il 2026-11-05T01:23:43.524Z)
  - session, 5h: 100 % residuo, reset 2026-11-05T04:50:00.000Z
  - week (all models), settimana: 9 % residuo, reset 2026-11-05T16:00:00.000Z
- **gemini**: settimana 8 %, 5 ore 98 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-11-05T17:37:53.000Z (letto da /usage il 2026-11-05T01:24:47.186Z)
  - Gemini Models, settimana: 8 % residuo, reset 2026-11-05T17:37:53.000Z
  - Gemini Models, 5h: 98 % residuo, reset 2026-11-05T01:42:58.000Z
- **argon**: settimana 14 %, 5 ore 14 %; tetto 1, slot 1 (task in programma 1), esaurimento previsto 2026-11-05T02:24:25.824Z, reset 2026-11-11T18:44:35.000Z (letto da /usage il 2026-11-05T01:20:45.229Z)
  - Gemini 4 Argon, settimana: 14 % residuo, reset 2026-11-11T18:44:35.000Z
- **fable**: settimana 9 %, 5 ore 100 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2026-11-05T13:59:12.717Z, reset 2026-11-05T16:00:00.000Z (letto da /usage il 2026-11-05T01:24:44.768Z)
  - session, 5h: 100 % residuo, reset 2026-11-05T04:50:00.000Z
  - week (all models), settimana: 9 % residuo, reset 2026-11-05T16:00:00.000Z
  - week (Fable), settimana: 59 % residuo, reset 2026-11-05T16:00:00.000Z

## In corso (1)

- **T255** I modelli di Claude distinti nella pipeline, lo sforzo (`effort`) e l'assegnazione dalla scheda — argon, 3 %

## Finiti, da guardare e integrare (`integra Txx`) (0)

_nessuno_

## Pronti, in ordine di priorità (6)

- **T273** Integrare a costo zero nei quattro universi esplorabili le strutture, i modelli e i suoni creati su Claude Cloud — claude, 4 %
- **T259** Lo Scenografo: progetto e misura degli interni separati dall'edificio — claude, 5 %
- **T260** Il versionamento del kernel (`X.Y.Z`) e la compatibilità degli universi — claude, 3 %
- **T262** Il salvataggio che non si ferma — claude, 6 %
- **T265** I commit non si perdono: fila su disco, tutte le scritture, token scaduto — claude, 6 %
- **T264** `?dev&teleport` ignora lo scostamento salvato — claude, 2 %

## Da approvare (provider e stima proposti) (0)

_nessuno_

## Da stimare (manca la riga `- Pipeline:`) (0)

_nessuno_

## Bloccati da dipendenze (14)

- **T88** Spendere i crediti che avanzano con la generazione differita — claude, 4 % (aspetta T207, T156)
- **T207** La generazione differita: un universo generato senza browser, solo dagli abbonamenti — claude, 6 % (aspetta T156)
- **T156** Il prompt nuovo nello Scultore del gioco — claude, 5 % (aspetta T258)
- **T233** La landing launcher nel sito — claude, 3 % (aspetta T232)
- **T237** La guida dei beta tester, in due file — claude, 2 % (aspetta T45f)
- **T242** Il rapporto aureo nei prompt dello Scultore e dell'Artista — claude, 1 % (aspetta T156)
- **T263** I pannelli e i comandi di ogni viandante in multigiocatore — claude, 8 % (aspetta T245a)
- **T245a** Il magazzino durevole e `vite` — claude, 7 % (aspetta T262)
- **T245b** Il lavoro degli NPC: i primi tre mestieri — claude, 12 % (aspetta T245a)
- **T245c** Gli altri mestieri del seme — claude, 7 % (aspetta T245b)
- **T245d** Le imprese — claude, 12 % (aspetta T245b, T263)
- **T245e** L'edificio per stadi — claude, 9 % (aspetta T245d)
- **T245f** Fuori vista — claude, 9 % (aspetta T245d, T245e)
- **T267** `tests/subscription.test.ts` rosso sotto carico, verde da solo: la causa — claude, 2 % (aspetta T255)

## In attesa dell'autore (13)

- **T45f** Il server su Google Cloud — claude, 6 %
- **T153** Gli universi steampunk, moderno e futuristico: leggerli e provarli — claude, 2 %
- **T258** Il kernel segna il suolo per i programmi delle strutture — claude, 5 %
- **T184** Le ambientazioni spazio, pirati, cowboy — claude, 2 %
- **T185** Generare gli universi spazio, pirati, cowboy — claude, 2 %
- **T232** Il sito come launcher: proposte della landing col rapporto aureo — claude, 3 %
- **T235** Showcase: carte famose e universi più giocati
- **T239** Quattro lingue: censimento e progetto
- **T240** Il piano di lancio: concorrenti, punti di forza, Boa Loger
- **T245g** Il Narratore scrive mestieri e imprese — claude, 10 %
- **T245h** I bivi degli NPC — claude, 10 %
- **T245i** Vite lunghe — claude, 10 %
- **T266** Un'altra tornata di rinomine — claude, 5 %
