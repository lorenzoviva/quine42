# ADR-0057 — Rune e binding per ruolo

Data: 2026-10-24 · Stato: accettato (task T37 del backlog) · Fase 0 di ADR-0050 (il multiplayer, decisioni 7 e 8); estende
ADR-0002 (le rune e i binding), ADR-0009 (la corona nascosta) e ADR-0053 (la partita).

## Contesto
In singola il viandante rompe il tappeto con le rune (`carpet.active = false`, `x = 9999`) e trascende: è il cuore del gioco.
In multigiocatore il tappeto e il mondo sono di tutti: una frase che sposta il tappeto o il viandante romperebbe la partita
degli altri. Il piano (ADR-0050) dice: i giocatori non hanno le rune del tappeto (`CARPET_TOKENS`) né quelle che scrivono
`x y speed carpet time`; il master ha una sola runa del tappeto, che lo porta nella Sala del Concilio; il rollback del
repository è solo suo, quello di un giocatore riguarda il suo tappeto e la sua frase. Il kernel non sapeva chi fosse il master,
né chi avesse scritto una riga di rune.

## Decisione
1. **Il master** è `partita.master` (`universe.json`): in multigiocatore l'id del viandante che ha creato l'universo, `io` finché
   non ci sono gli account (T44); `repairPartita` lo mette e lo ripara, e come il resto della partita non cambia più. In singola
   il campo non c'è e chi gioca è il master di tutto (`kernel.isMaster()` è sempre vero): **in singola nulla cambia**.
2. **Le righe del tappeto** (`carpetLine` in `runes.ts`): una riga che contiene un token del tappeto o la runa del Concilio, o che
   prima del primo `=` scrive un binding (non come campo: `p.x = 3` no). In multigiocatore nessuna viene generata nei luoghi,
   nemmeno nel chunk (0,0) (resta `x`, sparisce `speed = speed`).
3. **Una riga gira come chi l'ha scritta.** `RuneComp.by` è il viandante che l'ha incisa; il kernel esegue la riga dentro
   `as(by, …)` (i binding sono i suoi). Se chi l'ha scritta non è il master, o la riga è generata (senza `by`), in multigiocatore
   le scritture dei binding non arrivano: `K.run_line(key, lock)` le ignora nel `__newindex` dell'ambiente (anche `carpet = nil`
   e `time = 0`), e il `Host` dà copie del tappeto e delle posizioni (`carpet()`, `get(id, 'carpet' | 'pos')`), così
   `carpet.active = false` non tocca niente. Chi rompe il gioco lo rompe solo per sé.
4. **La runa del Concilio** (`COUNCIL_RUNE`, `concilio`): in multigiocatore il master la porta sempre e nessun altro (il kernel ne
   tiene la scorta ogni 10 tick, `councilStock`); pronunciata (T) o incisa, lo porta nella Sala del Concilio e non si consuma
   (`councilRune`). Il tappeto lo lascia andare: il kernel tiene chi è fuori dal tappeto (`offCarpet`) e `core.carpet` non lo vede
   (l'`Host` lo toglie da `ecs.each` mentre gira quel sistema) finché non rientra nel cerchio. Per gli altri la runa è muta.
5. **`R` per ruolo.** Il master fa il rollback di sempre, e ogni runa incisa torna a chi l'ha scritta; per un giocatore `R` riprende
   soltanto le rune che ha inciso (tornano nella sua frase, e con loro ciò che facevano): il repository e il mondo degli altri non
   cambiano.

## Conseguenze
- Un universo nato in singola e aperto in multigiocatore resta sicuro: le sue rune del tappeto, generate o vecchie, non spostano
  nessuno, perché non hanno `by` del master.
- Il tappeto è ancora uno solo nel kernel: «il suo tappeto» di un giocatore arriva con il server (T38), che darà a ogni
  giocatore un cerchio; finché non c'è, il rollback di un giocatore riprende la sua frase e non sposta il tappeto.
- Il ritorno del master dal Concilio nel mondo è quello di oggi (uscire dalla Sala e rientrare nel cerchio); god mode e la sua
  vista dei giocatori sono di T42.
- Test: `tests/roles.test.ts`.
