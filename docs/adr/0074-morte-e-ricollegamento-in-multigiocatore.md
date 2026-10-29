# ADR-0074 — Morte e ricollegamento in multigiocatore

Data: 2026-10-29 · Stato: accettato (task T43c del backlog) · Fase 3 di ADR-0050 (il multiplayer); estende ADR-0053 (la partita),
ADR-0054 (il viandante con un id), ADR-0058 (il kernel sul server), ADR-0059 (il client sottile) e ADR-0065 (il master in god mode).

## Contesto
In singola, quando `sys.needs` porta la salute a zero ed emette `morte`, il kernel ferma la partita (`dead = true`, `ui:death`) finché chi
gioca non preme «Continua» (`continueAfterDeath`). In multigiocatore più viandanti condividono lo stesso kernel sul server: la morte di un
giocatore non deve fermare il mondo degli altri, né toccare il master (che resta in god mode, ADR-0065). Inoltre, chi chiude la scheda e
rientra più tardi con lo stesso id deve ritrovare non solo ciò che porta, la frase, i bisogni, gli stati, le carte e i legami, ma anche la
posizione nel mondo in cui aveva lasciato il proprio viandante.

## Decisione
1. **Chi muore in multigiocatore** (`mortalDies` su `lua:morte`): se la partita è in multigiocatore, `keepGods()` risparmia sempre il
   master; per ogni altro viandante con `needs.morto` il kernel esegue `as(id, () => die(cause))`.
2. **Morte sul server senza fermare gli altri**: per un viandante remoto (`remote.has(id)`) `die(cause)` avvia il giudizio del Narratore
   (`judgeDeath`, pagato da chi muore, `deathVerdicts.get(id)`) e concatena subito `continueAfterDeath(id, cause)` (`dying.get(id)`),
   senza alzare `this.dead`. Finché il verdetto è in corso (`isDying(id)`), `stepWanderer` rifiuta i passi del viandante e il server gli
   manda una `correzione` sul posto.
3. **Risveglio e avviso al client**: `continueAfterDeath(id, cause)` gira come `id` (`as(id, …)`), applica la punizione di `partita.morte`
   (in piazza `(0, 0)` o sul posto, perdita totale o effetti scelti dal Narratore, `health >= 10`, `morto: false`), ricorda la morte nelle
   regole, salva lo stato ed emette `wanderer:died {id, causa, testo}`. `SessionServer` azzera il credito di passo e la vista precedente
   (`me`, `stato`) del client e gli accoda un avviso `morte`; `ThinClient` porta subito il viandante dove il verdetto lo fa risvegliare
   (`putMe`), allinea stato e frase e mostra il messaggio `Sei morto di <causa>. <testo>`.
4. **Posizione e ricollegamento**: `WandererState` (`world/giocatori/<id>.json`) salva anche `pos {x, y}` in coordinate del mondo (del
   tappeto, o `lastWorld` se nello studio). All'uscita del client `removeWanderer` salva lo stato; al rientro `addWanderer` legge il file e
   `applyWandererState` rimette il tappeto sulla posizione salvata (oltre a inventario, bisogni con `morto: false`, frase, stati e slot),
   mentre carte (`world/carte.json` e file timbrati) e legami (`world/people.json`) restano nel repository dell'universo.

## Conseguenze
- La morte di un giocatore applica la stessa punizione di T33 senza mai interrompere il tick o la sessione degli altri viandanti.
- Chi esce e rientra con lo stesso id riprende esattamente da dove era rimasto.
