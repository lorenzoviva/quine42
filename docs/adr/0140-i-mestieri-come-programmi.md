# ADR-0140 — I mestieri come programmi: `sys.lavoro`, la via, ciò che matura

Data: 2026-11-05 · Stato: accettato (task T245b del backlog) · Riferimenti: D8 dell'autore (04/11), `docs/design/comportamento-npc.md` (sezioni 1 e 7), `docs/design/espressivita.md` (primitiva N), ADR-0020 (la società), ADR-0024 (la vita degli NPC), ADR-0138

## Contesto

Oggi la giornata di un individuo è testo («lavora al campo di grano») che il kernel traduce in un posto e in una posa: il contadino sta chino sul campo e il campo non cambia mai. Il progetto di T245 vuole che un mestiere sia un **programma**: dati scritti una volta per mestiere, validati, usati da ogni individuo con quel mestiere, e che i sotto-compiti siano comportamenti di un elenco chiuso che cambiano il mondo davvero, senza chiamare i modelli. Questo è il primo pezzo: il motore, tre mestieri scritti a mano, e ciò che cresce da solo.

## Decisione

1. **Il programma di mestiere è un dato** (`mestieri` di un modulo `data`, nel seme `lavoro.contadino`, `lavoro.boscaiolo`, `lavoro.pescatore`): `id`, `nomi` (le parole di `mestiere` che lo prendono), `posto` (la casella del lavoro), `giornata` con i compiti di `mattina giorno sera notte`. `validateJobProgram` (`jobs.ts`) lo controlla per riferimento, come i piani dei luoghi: `fa` di un elenco chiuso (`JOB_BEHAVIOURS`), caselle che il terreno conosce, oggetti del registro, posti noti, durate da 5 a 300 secondi, al più 6 compiti per fase. Un programma che non torna non gira, e il kernel lo dice nel registro. Il Narratore che li scrive (`job.program`) è T245g.
2. **L'abbinamento** (`matchJob`): il mestiere, in minuscolo e senza articoli, è uno dei `nomi`; altrimenti una sua parola lo è («contadino del Rovo»); altrimenti nessun programma, e l'individuo vive come prima.
3. **Il kernel dice la fase e i posti, Lua fa il lavoro.** A ogni fase del giorno il kernel mette all'individuo il componente `mestiere` (i compiti della fase, `casa`, `piazza`, `lavoro`) e smette di sceglierne la meta e la posa. `sys.lavoro` (seme, ordine 28, dopo la fisica e prima del vagabondaggio) fa i compiti uno dopo l'altro, con lo stato del compito in corso nel componente `lavoro` e ciò che porta in `carico` (regola 4). Cammina mettendo `meta` al prossimo punto della via; `sys.wander` la segue come sempre. Al più 12 al lavoro per luogo caricato (`WORKERS_PER_PLACE`); chi segue o aspetta il viandante smette e torna alla vita di prima. `sys.lavoro` è un modulo nuovo, non `core.*`: arriva agli universi di prima con `upgradeFromSeed` (trappola 6 di T183).
4. **I comportamenti di questo task**: `vai`, `trasforma` (una casella `da` vicino al lavoro diventa `a` dopo `durata` di lavoro, `quante` volte), `raccogli` (come `trasforma`, e l'oggetto nel `carico`), `riposa mangia prega chiacchiera aspetta` (fermi nella posa), `pattuglia`. `porta prendi produci usa costruisci` sono nell'elenco e per ora si saltano: vengono con T245c e T245d.
5. **Due primitive del `Host`** (lettera N di T183): `world.path(x, y, tx, ty)` dà il prossimo punto (due caselle avanti) della via A* sulle caselle dei luoghi caricati (`route.ts`: otto direzioni, senza tagliare gli angoli, al più 4000 caselle guardate, una meta solida raggiunta accanto), tenuta in una cache per caselle di partenza e di arrivo, svuotata quando una casella cambia; `world.find_tile(codice, x, y, r)` dà il centro della casella con quel codice più vicina, entro 24.
6. **Ciò che matura è del kernel.** Un terreno dichiara `matura {dopo, in}` (campo nuovo dei `tiles`, assente vale «non matura»); a ogni fase del giorno, nei luoghi caricati, una casella di quel terreno diventa `in` quando sono passati `dopo` giorni da quando è stata scritta. **Il giorno di ogni modifica** sta nel piano del luogo, accanto a `plan.edits`: `plan.giorni` (indice → giorno). È un campo a parte e non un valore diverso di `edits`, così un kernel della stessa `X.Y` che non lo conosce legge le modifiche come prima; una modifica senza giorno (i piani di prima) vale da oggi, la prima volta che il kernel la guarda.
7. Il seme ha tre terreni nuovi (`e` campo seminato, che matura in un giorno in `u` grano maturo; `x` ceppaia, che in tre giorni torna `t` bosco) e due oggetti (`item.grano`, `item.pesce`).

## Alternative scartate

- **Un comportamento in TypeScript**: il kernel diventerebbe il gioco; in Lua un universo può riscrivere `sys.lavoro`, e il banco della Sala sistemi lo mostra con i suoi casi.
- **Il cammino scritto in Lua da ogni modulo**: il budget del tick è di tutti (T183); una via calcolata dal kernel e tenuta in cache costa una ricerca per tratto.
- **Il giorno dentro `edits`** (`indice → {codice, giorno}`): cambierebbe un formato che i kernel della stessa `X.Y` leggono; un campo accanto è aggiuntivo.
- **Far maturare con un sistema Lua**: la maturazione deve accadere anche dove nessuno guarda (T245f), dove Lua non c'è.

## Conseguenze

- La Sala sistemi ha una stazione in più (`sys.lavoro`, con due casi del banco); i moduli `lavoro.*` stanno nello Studio dei Personaggi.
- `tests/lavoro.test.ts` prova un luogo pianificato: il contadino ara, semina e miete, il seminato matura; il boscaiolo taglia e il bosco ricresce; il pescatore pesca; la sera in piazza, la notte a casa.
- Sicurezza: due funzioni nuove del `Host`, che leggono le caselle e calcolano una via entro un tetto di caselle guardate (il lavoro di una ricerca sta nel budget del tick, come ogni chiamata); nessuna rotta, nessun messaggio, nessun campo sul filo nuovo (la posa viaggia in `attivita`, già in `ENTITY_PARTS`).
