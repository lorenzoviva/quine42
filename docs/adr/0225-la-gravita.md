# ADR-0225 — La gravità

Data: 2026-11-19 · Stato: accettato (task T447 del backlog, S3 di [`docs/design/acqua-spazio.md`](../design/acqua-spazio.md) § 2.5) ·
Riferimenti: ADR-0224 (la fisica rimodellabile e la natura del mondo), ADR-0201 (le regioni del master), ADR-0041 e ADR-0064 (la regola 10),
ADR-0162 (i piani raggiungibili a piedi: `reachableStoreys`), ADR-0107 (il passo che il server controlla), ADR-0136 (la versione del kernel)

## Contesto

ADR-0224 ha messo la gravità fra le primitive della fisica: un campo di `universe.json → nature` (`gravity`, il peso di un corpo contro quello
della terra), fermo a 1 in `NATURE_ACCEPTS` finché il kernel non sapesse renderla vera, e «poi la regione e l'ambiente». Lo studio (§ 2.5)
chiede `gravity` da 0,2 a 2 per ambiente o regione: il salto (`JUMP_UP`, `JUMP_FAR`, la durata dell'arco) scala con 1/g, il passo appena; la
gravità zero (fluttuare, l'inerzia) non è camminare ed è esclusa. Nel browser: sull'asteroide il salto va lontano e lento.

Il salto di oggi non è solo un movimento: il kernel lo usa per dire che cosa si raggiunge. `reachableStoreys` (ADR-0162) e i controlli dello
Scultore contano i piani di una struttura raggiungibili saltando con `JUMP_UP` e `JUMP_FAR`; una gravità più pesante che accorciasse il salto
renderebbe irraggiungibile ciò che il kernel ha garantito (regola 10).

## Decisione

1. **La gravità è vera da 0,2 a 2** (`NATURE_ACCEPTS.gravity`), letta riparata da `gravityOf` (fuori dall'intervallo o non un numero: 1, la
   terra; regola 7). La zero resta esclusa, come dice lo studio.
2. **Il salto: la stessa spinta.** `leapOf(g)`: l'altezza e la portata scalano con 1/g, **mai sotto quelle della terra** (`reach =
   1/min(1, g)`), la durata dell'arco con 1/g (`time`). Con g 0,25 il salto va quattro volte più in alto e più lontano, e dura quattro volte
   tanto (0,32 s × 4 più 0,08 s a casella lungo la linea); con g 2 arriva dove arriva sulla terra con un arco lungo la metà. Così ciò che il
   kernel verifica con il salto della terra resta raggiungibile in ogni mondo, e la gravità pesante si vede nell'arco rapido e nel passo.
   `JUMP_UP` e `JUMP_FAR` restano le costanti della terra, quelle dei controlli; il kernel salta con `jumpUp()` e `jumpFar()`.
3. **Il passo, appena.** `gaitOf(g)`: un corpo fatto per la terra cammina un po' più piano lontano da lei, leggero (rimbalza, i piedi
   tengono meno) o pesante (si trascina): 1 sulla terra, 0,9 agli estremi (0,2 e 5, quindi 0,96 a 2). Il kernel lo moltiplica nel passo del
   viandante (`paceTick`, `player.step`), che `core.movement` legge come sempre e il server usa per il ritmo (`paceOf`).
4. **Dove sta.** La gravità del mondo è `nature.gravity`, dall'ambientazione e ferma dalla Genesi come il resto della natura (ADR-0224); oggi
   nessuna ambientazione ne porta una diversa (lo spazio di ADR-0221 è una stazione, con la gravità artificiale; l'asteroide e i pianeti
   vengono con T445 e T449). **Una regione del master ne dice una sua** (`Region.gravity`, ADR-0201): il master la scrive nel modulo «Dichiara
   regione» (la riga «gravità», vuota per quella del mondo), `masterRegion` la controlla (un numero nell'intervallo, mai su una regione
   trattenuta, che non è ancora del mondo), il kernel la legge solo da una regione del master che è del mondo (`regionGravity`). Il primo
   luogo non è di nessuna regione e ha quella del mondo. `Kernel.gravityAt(x, y)` dice la gravità di un punto, `Kernel.gravity()` quella dove
   sta il viandante che agisce; nella corona e nello studio è la terra (non sono il mondo).
5. **Chi non la scrive.** Lua la legge con `world.nature()` (la gravità del mondo) e non la scrive; il Concilio non scrive `universe.json` né
   le regioni del master. La gravità per ambiente scritta dal Fisico è della via del Fisico a mondo acceso (ADR-0224 § 1), un task dopo.

## Conseguenze

- Kernel **0.10.1**: il contratto non cambia. Un universo di oggi ha la gravità 1 e salta, cammina e si verifica come prima (lo dicono
  `tests/jump.test.ts` e `tests/gravity.test.ts`); un universe.json che diceva una gravità fra 0,2 e 2 a mano, prima riparata a 1, ora vale.
- Cose nuove: `gravityOf`, `leapOf`, `gaitOf` in `src/kernel/nature.ts`; `Region.gravity`, `regionGravity` in `src/kernel/atlas.ts`;
  `Kernel.gravity()`, `gravityAt`, `jumpUp()`, `jumpFar()`; il campo `gravity` nel messaggio `region` (`regionAsked`) e nel modulo del master.
- **In multigiocatore** il salto è solo da soli (uno specchio non salta: `Kernel.jump`); il passo che il client prevede usa la gravità del
  mondo (`nature` è pubblica) ma non quella delle regioni del master, che i client non vedono come del master (`REGION_FIELDS`): lo scarto
  è al più del 10 %, dentro la tolleranza del ritmo del server (`TOLERANCE` 1,15), che decide con la gravità vera.
- Restano: la pagina della campagna nel sito non ha ancora la riga della gravità (la rotta la accetta già, `masterRegion`); la gravità per
  ambiente dal Fisico; quella dei pianeti con T449.
- Sicurezza: nessuna superficie nuova oltre un numero in più nel messaggio `region` del master, controllato da `masterRegion` (intervallo,
  tipo) e prima ridotto a un numero finito sul filo (`regionAsked`).
