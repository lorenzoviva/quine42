# Il piano della pipeline

> Generato da `node tools/pipeline/pipeline.mjs stato` il 2026-11-14T14:05:09.141Z: non modificarlo a mano,
> la fonte è `docs/plans/backlog.md` (righe `- Pipeline:`).

## Budget

Orchestratore: **claude** (sotto il 10 % nessun task su di lui; si cambia con `orchestratore <provider>`).

- **claude** (Opus 5.5): settimana 80 %, 5 ore 76 %; tetto 3, slot 3 (task in programma 11), esaurimento previsto mai a questo ritmo, reset 2026-11-19T15:59:00.000Z (letto da /usage il 2026-11-14T14:01:28.350Z)
  - session, 5h: 76 % residuo, reset 2026-11-14T18:29:00.000Z
  - week (all models), settimana: 80 % residuo, reset 2026-11-19T15:59:00.000Z
- **gemini** (Gemini 3.8 Flash): settimana 99 %, 5 ore 97 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2027-01-15T19:29:33.889Z, reset 2026-11-20T23:47:38.000Z (letto da /usage il 2026-11-14T14:04:36.314Z)
  - Gemini Models, settimana: 99 % residuo, reset 2026-11-20T23:47:38.000Z
  - Gemini Models, 5h: 97 % residuo, reset 2026-11-14T17:26:53.000Z
- **argon** (Gemini 4 Argon): settimana 99 %, 5 ore 99 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2027-01-15T19:29:33.889Z, reset 2026-11-20T23:45:15.000Z (letto da /usage il 2026-11-14T14:04:36.314Z)
  - Gemini 4 Argon, settimana: 99 % residuo, reset 2026-11-20T23:45:15.000Z
- **fable** (Fable 5.2): settimana 79 %, 5 ore 72 %; tetto 1, slot 1 (task in programma 1), esaurimento previsto mai a questo ritmo, reset 2026-11-19T15:59:00.000Z (letto da /usage il 2026-11-14T14:04:33.490Z)
  - session, 5h: 72 % residuo, reset 2026-11-14T18:29:00.000Z
  - week (all models), settimana: 79 % residuo, reset 2026-11-19T15:59:00.000Z
  - week (Fable), settimana: 97 % residuo, reset 2026-11-19T15:59:00.000Z
- **sonnet** (Sonnet 5.5): settimana 79 %, 5 ore 72 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-11-19T15:59:00.000Z (letto da /usage il 2026-11-14T14:04:33.490Z)
  - session, 5h: 72 % residuo, reset 2026-11-14T18:29:00.000Z
  - week (all models), settimana: 79 % residuo, reset 2026-11-19T15:59:00.000Z
- **haiku** (Haiku 5.5): settimana 79 %, 5 ore 72 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-11-19T15:59:00.000Z (letto da /usage il 2026-11-14T14:04:33.490Z)
  - session, 5h: 72 % residuo, reset 2026-11-14T18:29:00.000Z
  - week (all models), settimana: 79 % residuo, reset 2026-11-19T15:59:00.000Z
- **agy-opus** (Opus 5.5 (agy)): settimana 100 %, 5 ore 100 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-11-21T14:04:36.000Z (letto da /usage il 2026-11-14T14:04:36.314Z)
  - Claude and GPT models, settimana: 100 % residuo, reset 2026-11-21T14:04:36.000Z
  - Claude and GPT models, 5h: 100 % residuo, reset 2026-11-14T19:04:36.000Z
- **agy-sonnet** (Sonnet 5.5 (agy)): settimana 100 %, 5 ore 100 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-11-21T14:04:36.000Z (letto da /usage il 2026-11-14T14:04:36.314Z)
  - Claude and GPT models, settimana: 100 % residuo, reset 2026-11-21T14:04:36.000Z
  - Claude and GPT models, 5h: 100 % residuo, reset 2026-11-14T19:04:36.000Z
- **hydrogen** (Gemini 4 Hydrogen): settimana 99 %, 5 ore 97 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2027-01-15T19:29:33.889Z, reset 2026-11-20T23:47:38.000Z (letto da /usage il 2026-11-14T14:04:36.314Z)
  - Gemini Models, settimana: 99 % residuo, reset 2026-11-20T23:47:38.000Z
  - Gemini Models, 5h: 97 % residuo, reset 2026-11-14T17:26:53.000Z
- **orchestrator** (Orchestrator (Argon)): settimana 99 %, 5 ore 97 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2027-01-15T19:29:33.889Z, reset 2026-11-20T23:47:38.000Z (letto da /usage il 2026-11-14T14:04:36.314Z)
  - Gemini Models, settimana: 99 % residuo, reset 2026-11-20T23:47:38.000Z
  - Gemini Models, 5h: 97 % residuo, reset 2026-11-14T17:26:53.000Z
  - Gemini 4 Argon, settimana: 99 % residuo, reset 2026-11-20T23:45:15.000Z

## In corso (2)

- **T355** Il giro su Gemini dello Scultore nuovo, prima di cambiare quello del gioco (passo 3 di D48) — claude (Opus 5.5), sforzo high, 3 %
- **T363** Open beta: le chiavi dei giocatori sul server e il turno delle comuni — fable (Fable 5.2), sforzo extra, 6 %

## Finiti, da guardare e integrare (`integra Txx`) (1)

- **T386** La licenza: PolyForm Noncommercial alla lettera, il self-hosting gratuito permesso per iscritto — ESITO: in attesa — `LICENSE.md` riscritto: § 1 PolyForm Noncommercial 1.0.0 alla lettera (identico byte per byte alla fonte, con `Required Notice`), § 2 permessi aggiuntivi a parte per il self-hosting gratuito, § 3 CC BY-NC-SA 4.0 con link funzionanti e le cartelle che esistono (`universe/` tranne il Lua, `docs/`), § 4 e `NOTICE.md` nuovo con MarkovJunior sotto MIT; tolte la clausola anti-concorrenza e la definizione riscritta; `package.json` e lock dicono `SEE LICENSE IN LICENSE.md`; README e `docs/lancio/piano.md` (D7.3) allineati. Manca l'approvazione dell'autore sulle domande (a) anti-concorrenza, (b) nome del titolare, (c) non profit, (d) donazioni, in `docs/pipeline/domande/T386.md`. Non è un parere legale: va riletto da un legale prima del lancio. Test e typecheck non lanciati (nessun codice cambiato). Sicurezza: nessuna superficie nuova. — claude (Opus 5.5), sforzo high, 2 %

## Pronti, in ordine di priorità (3)

- **T387** Il gioco al tocco: muoversi, orbitare, zoomare e i comandi di gioco su un telefono — claude (Opus 5.5), sforzo extra, 3 %
- **T370** Il lotto di 2 × 2 luoghi per le strutture gargantuesche — claude (Opus 5.5), sforzo extra, 10 %
- **T375** Campagna: le regioni del master (riempitivo e trattenuta) — claude (Opus 5.5), sforzo high, 4 %

## Da approvare (provider e stima proposti) (1)

- **T369** (dopo) Un endpoint compatibile per modelli locali su RunPod o Vast.ai — claude (Opus 5.5), sforzo high, 4 %

## Da stimare (manca la riga `- Pipeline:`) (0)

_nessuno_

## Bloccati da dipendenze (8)

- **T237** La guida dei beta tester, in due file — claude (Opus 5.5), 2 % (aspetta T45f)
- **T364** Open beta: «Collega OpenRouter» nel gioco e nel sito — claude (Opus 5.5), sforzo high, 3 % (aspetta T363)
- **T367** Open beta: il pacchetto e la guida del self-hosting — claude (Opus 5.5), sforzo high, 4 % (aspetta T363)
- **T368** Open beta: la pagina «Come usiamo l'IA» — claude (Opus 5.5), sforzo medium, 1 % (aspetta T363)
- **T377** Campagna: la campagna nel sito — claude (Opus 5.5), sforzo high, 2 % (aspetta T375)
- **T388** L'HUD su un telefono: meno ingombro, le istruzioni in un aiuto, «gira il telefono» in verticale — claude (Opus 5.5), sforzo high, 2 % (aspetta T387)
- **T389** I laboratori MJ dei voxel su un telefono: la preview visibile, lo zoom, gli strumenti nei menu — claude (Opus 5.5), sforzo high, 2.5 % (aspetta T387)
- **T390** Il SoundLab su un telefono: UX da rifinire — claude (Opus 5.5), sforzo high, 1.5 % (aspetta T389)

## In attesa dell'autore (15)

- **T45f** Il server su Google Cloud — claude (Opus 5.5), 6 %
- **T153** Gli universi steampunk, moderno e futuristico: leggerli e provarli — claude (Opus 5.5), 2 %
- **T259** Lo Scenografo: progetto e misura degli interni separati dall'edificio — claude (Opus 5.5), 5 %
- **T184** Le ambientazioni spazio, pirati, cowboy — claude (Opus 5.5), 2 %
- **T185** Generare gli universi spazio, pirati, cowboy — claude (Opus 5.5), 2 %
- **T235** Showcase: carte famose e universi più giocati
- **T239** Quattro lingue: censimento e progetto
- **T240** Il piano di lancio: concorrenti, punti di forza, Boa Lodger
- **T245g** Il Narratore scrive mestieri e imprese — claude (Opus 5.5), 10 %
- **T245h** I bivi degli NPC — claude (Opus 5.5), 10 %
- **T245i** Vite lunghe — claude (Opus 5.5), 10 %
- **T266** Un'altra tornata di rinomine — claude (Opus 5.5), 5 %
- **T287** La scelta della veste: subito dall'autore, o col voto dei beta tester
- **T303** La misura vera dello Scenografo, con gli abbonamenti — claude (Opus 5.5), sforzo high, 3 %
- **T371** Il forte dell'autore come riferimento della qualità «ottima» — fable (Fable 5.2), sforzo extra, 5 %
