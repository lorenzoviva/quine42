# Il piano della pipeline

> Generato da `node tools/pipeline/pipeline.mjs stato` il 2026-11-14T12:22:51.891Z: non modificarlo a mano,
> la fonte è `docs/plans/backlog.md` (righe `- Pipeline:`).

## Budget

Orchestratore: **claude** (sotto il 10 % nessun task su di lui; si cambia con `orchestratore <provider>`).

- **claude** (Opus 5.5): settimana 34 %, 5 ore 29 %; tetto 3, slot 1 (task in programma 8), esaurimento previsto 2026-11-15T10:32:11.486Z, reset 2026-11-19T15:59:00.000Z (letto da /usage il 2026-11-14T12:22:36.375Z)
  - session, 5h: 29 % residuo, reset 2026-11-14T13:59:00.000Z
  - week (all models), settimana: 34 % residuo, reset 2026-11-19T15:59:00.000Z
- **gemini** (Gemini 3.8 Flash): settimana 100 %, 5 ore 100 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-11-20T23:47:38.000Z (letto da /usage il 2026-11-14T12:18:15.043Z)
  - Gemini Models, settimana: 100 % residuo, reset 2026-11-20T23:47:38.000Z
  - Gemini Models, 5h: 100 % residuo, reset 2026-11-14T17:18:14.000Z
- **argon** (Gemini 4 Argon): settimana 99 %, 5 ore 99 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2027-01-08T10:14:07.889Z, reset 2026-11-20T23:45:15.000Z (letto da /usage il 2026-11-14T12:18:15.043Z)
  - Gemini 4 Argon, settimana: 99 % residuo, reset 2026-11-20T23:45:15.000Z
- **fable** (Fable 5.2): settimana 3 %, 5 ore 29 %, fermo fino a 2026-11-19T16:00:00.000Z; tetto 1, slot 1 (task in programma 1), esaurimento previsto 2026-11-14T14:23:52.296Z, reset 2026-11-19T16:00:00.000Z (letto da /usage il 2026-11-14T12:18:12.517Z)
  - session, 5h: 29 % residuo, reset 2026-11-14T14:00:00.000Z
  - week (all models), settimana: 34 % residuo, reset 2026-11-19T16:00:00.000Z
  - week (Fable), settimana: 3 % residuo, reset 2026-11-19T16:00:00.000Z
- **sonnet** (Sonnet 5.5): settimana 34 %, 5 ore 29 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2026-11-15T10:32:11.486Z, reset 2026-11-19T16:00:00.000Z (letto da /usage il 2026-11-14T12:18:12.517Z)
  - session, 5h: 29 % residuo, reset 2026-11-14T14:00:00.000Z
  - week (all models), settimana: 34 % residuo, reset 2026-11-19T16:00:00.000Z
- **haiku** (Haiku 5.5): settimana 34 %, 5 ore 29 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2026-11-15T10:32:11.486Z, reset 2026-11-19T16:00:00.000Z (letto da /usage il 2026-11-14T12:18:12.517Z)
  - session, 5h: 29 % residuo, reset 2026-11-14T14:00:00.000Z
  - week (all models), settimana: 34 % residuo, reset 2026-11-19T16:00:00.000Z
- **agy-opus** (Opus 5.5 (agy)): settimana 100 %, 5 ore 100 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-11-21T12:18:14.000Z (letto da /usage il 2026-11-14T12:18:15.043Z)
  - Claude and GPT models, settimana: 100 % residuo, reset 2026-11-21T12:18:14.000Z
  - Claude and GPT models, 5h: 100 % residuo, reset 2026-11-14T17:18:14.000Z
- **agy-sonnet** (Sonnet 5.5 (agy)): settimana 100 %, 5 ore 100 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-11-21T12:18:14.000Z (letto da /usage il 2026-11-14T12:18:15.043Z)
  - Claude and GPT models, settimana: 100 % residuo, reset 2026-11-21T12:18:14.000Z
  - Claude and GPT models, 5h: 100 % residuo, reset 2026-11-14T17:18:14.000Z
- **hydrogen** (Gemini 4 Hydrogen): settimana 100 %, 5 ore 100 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto mai a questo ritmo, reset 2026-11-20T23:47:38.000Z (letto da /usage il 2026-11-14T12:18:15.043Z)
  - Gemini Models, settimana: 100 % residuo, reset 2026-11-20T23:47:38.000Z
  - Gemini Models, 5h: 100 % residuo, reset 2026-11-14T17:18:14.000Z
- **orchestrator** (Orchestrator (Argon)): settimana 99 %, 5 ore 100 %; tetto 1, slot 1 (task in programma 0), esaurimento previsto 2027-01-08T10:14:07.889Z, reset 2026-11-20T23:45:15.000Z (letto da /usage il 2026-11-14T12:18:15.043Z)
  - Gemini Models, settimana: 100 % residuo, reset 2026-11-20T23:47:38.000Z
  - Gemini Models, 5h: 100 % residuo, reset 2026-11-14T17:18:14.000Z
  - Gemini 4 Argon, settimana: 99 % residuo, reset 2026-11-20T23:45:15.000Z

## In corso (1)

- **T242** Il rapporto aureo nei prompt dello Scultore e dell'Artista — claude (Opus 5.5), 1 %

## Finiti, da guardare e integrare (`integra Txx`) (1)

- **T373** Campagna: il ritmo e la pausa del mondo — ESITO: fatto — ritmo del mondo `pace` normal/slow/hold (`src/kernel/worldPace.ts`), mai sopra la lobby; in pausa i luoghi nuovi restano bozze senza chiamate, quelli noti tornano, fermo ciò che il mondo fa da sé, le risposte ai viandanti continuano; «normale» riprende dai giocatori; messaggio `pace` del master con un limite suo, `pace` in `welcome`/`update`, avviso dell'HUD distinto per master e giocatore; `.campaign → pace` scritto solo dal server e dato al mondo per valore, rotta `/api/universe/<nome>/pace`; console e Direzione; ADR-0196, regola 8b-bis, V-039, kernel 0.7.7. Restano: da soli il ritmo non si salva; le tappe delle trame dovute in pausa accadono tutte alla ripresa; non provato da un test il riavvio di un mondo vero in pausa. — claude (Opus 5.5), sforzo high, 3 %

## Pronti, in ordine di priorità (3)

- **T355** Il giro su Gemini dello Scultore nuovo, prima di cambiare quello del gioco (passo 3 di D48) — claude (Opus 5.5), sforzo high, 3 %
- **T363** Open beta: le chiavi dei giocatori sul server e il turno delle comuni — fable (Fable 5.2), sforzo extra, 6 %
- **T370** Il lotto di 2 × 2 luoghi per le strutture gargantuesche — claude (Opus 5.5), sforzo extra, 10 %

## Da approvare (provider e stima proposti) (1)

- **T369** (dopo) Un endpoint compatibile per modelli locali su RunPod o Vast.ai — claude (Opus 5.5), sforzo high, 4 %

## Da stimare (manca la riga `- Pipeline:`) (0)

_nessuno_

## Bloccati da dipendenze (6)

- **T237** La guida dei beta tester, in due file — claude (Opus 5.5), 2 % (aspetta T45f)
- **T364** Open beta: «Collega OpenRouter» nel gioco e nel sito — claude (Opus 5.5), sforzo high, 3 % (aspetta T363)
- **T367** Open beta: il pacchetto e la guida del self-hosting — claude (Opus 5.5), sforzo high, 4 % (aspetta T363)
- **T368** Open beta: la pagina «Come usiamo l'IA» — claude (Opus 5.5), sforzo medium, 1 % (aspetta T363)
- **T375** Campagna: le regioni del master (riempitivo e trattenuta) — claude (Opus 5.5), sforzo high, 4 % (aspetta T373)
- **T377** Campagna: la campagna nel sito — claude (Opus 5.5), sforzo high, 2 % (aspetta T373, T375)

## In attesa dell'autore (15)

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
- **T303** La misura vera dello Scenografo, con gli abbonamenti — claude (Opus 5.5), sforzo high, 3 %
- **T371** Il forte dell'autore come riferimento della qualità «ottima» — fable (Fable 5.2), sforzo extra, 5 %
