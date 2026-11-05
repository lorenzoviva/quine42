# ADR-0146 — I modelli e lo sforzo nella pipeline

Data: 2026-11-05 · Stato: accettato · Riferimenti: ADR-0072 (la pipeline), ADR-0087 (i tetti dell'autore), ADR-0115 (Fable, che questo ADR aggiorna), ADR-0119 (piani e finestra delle 5 ore)

## Contesto

Il provider `claude` è Opus 5.5 e nulla lo diceva; Sonnet, Haiku e i modelli di Claude su `agy` non si potevano assegnare. La scheda `docs/pipeline/modelli.md` (T254, T257, T268) dà le misure e una proposta, che l'autore ha approvato il 04/11 (D31) con Opus predefinito, i provider nuovi in prova e Argon solo per task piccoli.

L'autore ha chiesto anche di stimare e distinguere per task il livello di sforzo: con `max` i risultati l'hanno colpito. La sua decisione del 05/11: **la qualità conta più del tempo**, quindi tanti task `high`, una parte `extra`, `max` qua e là; `medium` e `low` non sono più il predefinito.

## Decisione

- **Provider nuovi, a tetto 1, in prova:** `sonnet` e `haiku` sulla CLI di Claude e sul suo conto (`stessoContoDi: claude`); `agy-opus` e `agy-sonnet` su `agy`, sul contatore `Claude and GPT models`, senza browser. Nessuno è orchestrabile. I tetti delle CLI restano 3 su `claude` e 1 su `agy`. Il nome `claude` resta com'è, per non riscrivere il backlog: `stato`, `indice`, `assegna`, `PIANO.md` e la pagina web dicono il modello per nome (`modello` in `config.json`, `modelOf`).
- **Il conto è condiviso anche sulla settimana:** `fitsOn` toglie dal residuo le stime dei task in corso di tutto il conto (`accountOf`), come `windowAdmits` già faceva per le 5 ore.
- **Lo sforzo è un campo della riga `- Pipeline:`** (`sforzo low|medium|high|extra|xhigh|max`). `assegna` lo scrive con `--sforzo` o col token `sforzo`, tiene quello di prima se non è detto e, a un task che non ne ha mai avuto uno, dà `sforzoPredefinito` di `config.json` (`high`). Un task senza sforzo scritto parte con lo `sforzo` del suo provider in `config.json`, se c'è, altrimenti col predefinito della CLI: `assegna` è l'unico che riempie la riga.
- **Al lancio** lo sforzo arriva alla CLI, anche riprendendo una conversazione (`launchArgs`): su `claude` come `--effort` (`extra` → `xhigh`, che è il nome che la CLI accetta); su `agy` come suffisso del modello (`low` → `-low`, `medium` → `-medium`, tutti gli altri → `-high`, il massimo che `agy` offre).
- **Si misura:** `sforzo` sta nella voce di `.pipeline/esecuzioni.json` e nella riga di `docs/pipeline/consumi.jsonl`.
- **Fable può orchestrare se l'autore lo spunta** nella pagina web (`orchestrabile`): aggiorna ADR-0115, che diceva «mai orchestratore». Resta fuori da `orchestra.ordine`, quindi non ci si arriva da soli: si sceglie con `/agente fable`. `orchestra.finestra.fable` gli dà la sua finestra. Il predefinito in `config.json` resta `orchestrabile: false`.
- **Le domande per l'autore si scrivono per intero in chat**, numerate e con la raccomandazione: i file di `domande/` non bastano. L'elenco vivo è `docs/pipeline/domande/aperte.md`.

## Conseguenze

- `ratioSessioneSettimana` di `sonnet` e `haiku` è provvisorio, uguale a `claude`: non è misurato. Quello di `agy-opus` e `agy-sonnet` (2) è misurato in T268 su poche prove brevi.
- Quanto pesino `extra` e `max` sui contatori non è misurato: le stime dei task con quegli sforzi si alzano a giudizio finché `consumi.jsonl` non dà un numero.
- `gpt-oss-120b-medium` resta fuori: T268 non ha misurato alcun calo e non ha un uso proposto.
- L'orchestratore non prende lo sforzo dalla riga di un task: gira con ciò che dice il suo provider in `config.json`.
- Le righe `- Sforzo:` già scritte a mano nel backlog non contano per lo script: l'orchestratore le riporta con `assegna`.
