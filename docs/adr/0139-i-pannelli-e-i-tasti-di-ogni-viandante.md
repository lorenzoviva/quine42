# ADR-0139 — I pannelli e i tasti di ogni viandante in una partita di molti

Data: 2026-11-05 · Stato: accettato (task T263 del backlog) · Riferimenti: D10 dell'autore (04/11), `docs/design/espressivita.md` (primitive W e K), ADR-0058 (il kernel sul server), ADR-0059 (il client sottile), ADR-0107 (il ritmo dei messaggi), ADR-0109 (ciò che esce, a elenco)

## Contesto

T183 ha provato che in multigiocatore nessuna meccanica con un pannello si legge e nessun veicolo si guida: i `campo` dei pannelli (un componente del viandante, `componente.campo`) restano sul server, che manda al client solo bisogni, stati, inventario e slot; un sistema gira una volta sola, come chi tiene il corpo predefinito, e sul server nessun tasto di nessun client arriva. `world.player()` è uno solo.

## Decisione

1. **W: i campi dei pannelli in `MyState`.** Il server manda a ogni viandante `campi`: per ogni elemento di un `manifest.ui` con `campo`, il valore che quel campo ha sul suo corpo (`panelFields`, con `as`). È un elenco (regola 8f): solo i campi nominati da un pannello, solo testi (a 200 caratteri), numeri finiti e booleani. Un altro campo dello stesso componente, o un componente che nessun pannello nomina, non esce. Sul client `takePanelFields` scrive i campi ricevuti nei componenti del suo viandante, solo se un pannello che il client conosce li nomina, e mai nei componenti che il kernel tiene da sé (`needs`, `stati`, `inventory`, `slots`, `pos`…).
2. **K: i tasti di ogni viandante.** Il client manda `{ t: 'tasti', tenuti }` quando le direzioni che tiene cambiano, già ruotate nei termini del mondo (`input.isHeld`); il server non risponde e tiene solo `up down left right` (`setHeldOf`), nel ritmo di ogni messaggio (regola 8e: non chiama i modelli). Chi esce porta via i suoi tasti.
3. **K in Lua: `input.held(azione, id)` e `world.wanderers()`.** `id` è il corpo di un viandante: vale ciò che il suo client ha detto o, se non ha detto niente, la tastiera di questo kernel per il viandante a cui appartiene (`inputFor`). Senza `id`, il viandante che agisce, come prima. `world.wanderers()` dà ogni viandante con un corpo: `{id, chi, x, y}` (corpo, chi è, dove sta nel mondo), nient'altro di lui. Da soli è uno, e tutto va come prima.
4. Un'API nuova per Lua segue la convenzione: `Host`, `prelude.lua`, `LUA_API` del validatore, il prompt dell'Ingegnere, `AGENTS.md`.

## Alternative scartate

- **Mandare i componenti interi del viandante**: un modulo vi tiene ciò che il pannello non mostra (le carte coperte di una bisca); la regola 8f vuole un elenco.
- **Far girare ogni sistema una volta per viandante** (come `PER_WANDERER`): moltiplica il costo per il numero dei viandanti e rompe ciò che è comune (un carro, una palla); un sistema che vuole ognuno lo chiede a `world.wanderers()`.
- **I tasti con i passi** (`passo`): un viandante fermo che tiene un tasto (il timone, le redini) non fa passi.

## Conseguenze

- `tests/espressivita/`: il carro, la barca e la partita usano `world.wanderers()` e `input.held(azione, id)`; i due `LIMIT (multiplayer)` sono ora test che riescono. `tests/pannelli-tasti.test.ts` prova ogni meccanica di T183 con un pannello sul filo, `tests/sicurezza/pannelli.test.ts` il filtraggio.
- Sicurezza: un messaggio nuovo sul filo (`tasti`), senza risposta, che il server legge come un elenco di nomi fra quattro; un campo nuovo in `MyState`, a elenco e per viandante. `world.wanderers()` dice a un modulo dove sono gli altri viandanti: ciò che il gioco già mostra a chi è vicino, ora anche a un sistema, mai di più (né nome, né inventario, né crediti).
