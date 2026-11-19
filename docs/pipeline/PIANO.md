# Il piano della pipeline

> Generato da `node tools/pipeline/pipeline.mjs stato` il 2026-11-19T22:33:47.079Z: non modificarlo a mano,
> la fonte è `docs/plans/backlog.md` (righe `- Pipeline:`).

## Budget

Orchestratore: **orchestrator** (sotto il 10 % nessun task su di lui; si cambia con `orchestratore <provider>`).

- **claude** (Opus 5.5): settimana 92 %, 5 ore 92 %; tetto 3, slot 1 (task in programma 13), esaurimento previsto 2026-11-23T04:45:19.465Z, reset 2026-11-26T16:00:00.000Z (letto da /usage il 2026-11-19T22:33:44.562Z)
  - week (all models), settimana: 92 % residuo, reset 2026-11-26T16:00:00.000Z
- **gemini** (Gemini 3.8 Flash): settimana 96 %, 5 ore 98 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2027-01-05T19:24:57.745Z, reset 2026-11-26T12:30:10.000Z (letto da /usage il 2026-11-19T22:33:47.052Z)
  - Gemini Models, settimana: 96 % residuo, reset 2026-11-26T12:30:10.000Z
  - Gemini Models, 5h: 98 % residuo, reset 2026-11-20T03:30:17.000Z
- **argon** (Gemini 4 Argon): settimana 72 %, 5 ore 72 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2026-11-24T22:57:03.091Z, reset 2026-11-26T12:22:46.000Z (letto da /usage il 2026-11-19T22:33:47.052Z)
  - Gemini 4 Argon, settimana: 72 % residuo, reset 2026-11-26T12:22:46.000Z
- **fable** (Fable 5.2): settimana 92 %, 5 ore 92 %, sospeso; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2026-11-23T01:15:38.688Z, reset 2026-11-26T15:59:00.000Z (letto da /usage il 2026-11-19T22:32:40.322Z)
  - week (all models), settimana: 92 % residuo, reset 2026-11-26T15:59:00.000Z
  - week (Fable), settimana: 100 % residuo, reset 2026-11-26T16:00:00.000Z
- **sonnet** (Sonnet 5.5): settimana 92 %, 5 ore 92 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2026-11-23T01:15:38.688Z, reset 2026-11-26T15:59:00.000Z (letto da /usage il 2026-11-19T22:32:40.322Z)
  - week (all models), settimana: 92 % residuo, reset 2026-11-26T15:59:00.000Z
- **haiku** (Haiku 5.5): settimana 92 %, 5 ore 92 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2026-11-23T01:15:38.688Z, reset 2026-11-26T15:59:00.000Z (letto da /usage il 2026-11-19T22:32:40.322Z)
  - week (all models), settimana: 92 % residuo, reset 2026-11-26T15:59:00.000Z
- **agy-opus** (Opus 5.5 (agy)): settimana 100 %, 5 ore 100 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-11-26T22:33:47.000Z (letto da /usage il 2026-11-19T22:33:47.052Z)
  - Claude and GPT models, settimana: 100 % residuo, reset 2026-11-26T22:33:47.000Z
  - Claude and GPT models, 5h: 100 % residuo, reset 2026-11-20T03:33:47.000Z
- **agy-sonnet** (Sonnet 5.5 (agy)): settimana 100 %, 5 ore 100 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-11-26T22:33:47.000Z (letto da /usage il 2026-11-19T22:33:47.052Z)
  - Claude and GPT models, settimana: 100 % residuo, reset 2026-11-26T22:33:47.000Z
  - Claude and GPT models, 5h: 100 % residuo, reset 2026-11-20T03:33:47.000Z
- **hydrogen** (Gemini 4 Hydrogen): settimana 96 %, 5 ore 98 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2027-01-05T18:10:56.641Z, reset 2026-11-26T12:30:10.000Z (letto da /usage il 2026-11-19T22:33:47.052Z)
  - Gemini Models, settimana: 96 % residuo, reset 2026-11-26T12:30:10.000Z
  - Gemini Models, 5h: 98 % residuo, reset 2026-11-20T03:30:17.000Z
- **orchestrator** (Orchestrator (Argon)): settimana 72 %, 5 ore 98 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2026-11-24T22:57:03.091Z, reset 2026-11-26T12:22:46.000Z (letto da /usage il 2026-11-19T22:33:47.052Z)
  - Gemini Models, settimana: 96 % residuo, reset 2026-11-26T12:30:10.000Z
  - Gemini Models, 5h: 98 % residuo, reset 2026-11-20T03:30:17.000Z
  - Gemini 4 Argon, settimana: 72 % residuo, reset 2026-11-26T12:22:46.000Z

## In corso (0)

_nessuno_

## Finiti, da guardare e integrare (`integra Txx`) (1)

- **T447** S3 · La gravità — ESITO: fatto — gravità 0,2-2 (`nature.gravity`, ADR-0225, kernel 0.10.1): il salto scala con 1/g (più alto, lontano, lento), mai sotto quello della terra con cui il kernel verifica ciò che si raggiunge; il passo appena (0,9 a 0,2); una regione del master dice la sua (`Region.gravity`, mai su una trattenuta, la riga nel modulo «Dichiara regione», il campo nel messaggio `region`); corona, studio e primo luogo a 1; tests/gravity.test.ts, suite e typecheck verdi; mancano la riga nella pagina della campagna del sito, la gravità per ambiente dal Fisico, i pianeti (T449); in multigiocatore il client non prevede la gravità delle regioni del master (scarto ≤10 % del passo, dentro la tolleranza del server); sicurezza: un numero in più nel messaggio `region`, controllato da `regionAsked` e `masterRegion`. — claude (Opus 5.5), sforzo high, 1.5 %

## Pronti, in ordine di priorità (4)

- **T453** Integrare T447 nel base (conflitto con T438: AGENTS.md, kernel.ts, kernel 0.10.1) — claude (Opus 5.5), sforzo high, 2 %
- **T454** Ripulire `orichalcum`, `neapolis` e `sidera` dai luoghi e individui di `?offline` e dagli ambienti medievali del seme, e completare i 25 luoghi col Cartografo vero — claude (Opus 5.5), sforzo high, 2 %
- **T439** P3 · Il veicolo, da soli — claude (Opus 5.5), sforzo extra, 6 %
- **T441** P2 · L'arcipelago dall'atlante, isole lontane a nuoto — claude (Opus 5.5), sforzo high, 6 %

## Da approvare (provider e stima proposti) (2)

- **T369** (dopo) Un endpoint compatibile per modelli locali su RunPod o Vast.ai — claude (Opus 5.5), sforzo high, 4 %
- **T452** N0b · Il Fisico a mondo acceso — claude (Opus 5.5), sforzo high, 3 %

## Da stimare (manca la riga `- Pipeline:`) (0)

_nessuno_

## Bloccati da dipendenze (13)

- **T401** Il kernel 0.9.0 con il tag — claude (Opus 5.5), sforzo medium, 1 % (aspetta T45f, T237)
- **T237** La guida dei beta tester, in due file — claude (Opus 5.5), 2 % (aspetta T45f)
- **T440** P5 · Lo Scultore delle navi — claude (Opus 5.5), sforzo high, 5 % (aspetta T439)
- **T442** P4 · Il veicolo in molti — claude (Opus 5.5), sforzo extra, 6 % (aspetta T439)
- **T443** P6 · Porti, moli, secche — claude (Opus 5.5), sforzo high, 3 % (aspetta T440, T441)
- **T444** P7 · Affondare e relitti — claude (Opus 5.5), sforzo high, 3 % (aspetta T442, T185)
- **T445** S1 · Il vuoto, il cielo, il giorno — claude (Opus 5.5), sforzo high, 4 % (aspetta T441)
- **T446** S2 · L'aria e l'ossigeno — claude (Opus 5.5), sforzo high, 4 % (aspetta T445)
- **T448** S4 · Le astronavi e le capsule — claude (Opus 5.5), sforzo high, 2 % (aspetta T442, T445)
- **T449** S5 · I pianeti a definizione variabile e il viaggio — claude (Opus 5.5), sforzo extra, 9 % (aspetta T448)
- **T450** S6 · Lo spazio nel Concilio — claude (Opus 5.5), sforzo high, 3 % (aspetta T445, T446, T447, T185)
- **T451** P8 · Il mare a schermo — claude (Opus 5.5), sforzo high, 2 % (aspetta T439)
- **T455** Riscolpire senza merli né feritoie le strutture non fortificate di `orichalcum`, `neapolis` e `sidera` e le 6 strutture fallite in T411 — claude (Opus 5.5), sforzo high, 3 % (aspetta T454)

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
