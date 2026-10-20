# ADR-0014 — Azioni libere («Altro…») e il motore degli effetti

Data: 2026-10-20 · Stato: accettato

## Contesto
Alcune casse non si aprivano (oggetti generati senza contenitore) e il menu delle azioni era chiuso:
il giocatore poteva fare solo ciò che il modulo prevedeva. L'autore chiede un'azione «Altro…» in cui
il giocatore scrive cosa fa, sempre vagliata dal Concilio.

## Decisione
- Ogni menu (`E`) termina con **Altro…**: il giocatore scrive l'azione; il Narratore la giudica
  (`action.judge`, `src/kernel/agents/effects.ts`) e sceglie **effetti da un insieme chiuso**
  (`Effect` in `types.ts`): `messaggio bisogni crea_oggetto consuma distruggi apri contenitore terreno
  fuoco luce scudo spingi evoca`.
- Il kernel li **valida** (`validateEffects`): tipi sconosciuti scartati, numeri limitati, nomi risolti
  in id (oggetti, moduli, terreni); oggetti nuovi definiti dal Narratore e poi rivalidati. Se l'azione
  richiede un oggetto (`serve`), deve essere davvero in tasca.
- Gli effetti li applica **`core.effects`** (Lua, nell'universo: il giocatore può riscriverlo) con nuove
  API: `world.set_tile`, `world.open`, `world.make_container`; fuoco, luci evocate e scudi sono
  componenti (`fuoco`, `luce`, `effimero`, `scudo`) gestiti da `sys.fire`.
- Un'azione sensata e ripetibile viene **imparata**: entra in `manifest.actions` con i suoi `effects`
  (commit dell'agente) e da allora compare nel menu di ogni copia dell'oggetto, senza altre chiamate.
- Le modifiche al terreno sono salvate nel piano del luogo (`ChunkPlan.edits`): il mondo resta cambiato.
- Mobili-contenitore: un concetto della Fucina il cui nome è una cassa, credenza, baule… riceve sempre
  un contenitore; gli edifici non possono più essere forgiati come oggetti (vengono dai layout).

## Conseguenze
- 1 chiamata di testo per azione nuova; zero per quelle imparate.
- Il Concilio non può inventare effetti fuori dall'insieme: niente rotture, al massimo «non succede niente».
