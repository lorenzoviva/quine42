# ADR-0272 — I rami di MarkovJunior di mxgmn: il turno, il passo vuoto, il ricominciare, il `markov` dal primo figlio, la `map` e la `wfc` che chiudono la corsa

- **Stato**: accettato
- **Data**: 2026-11-27
- **Task**: T528 (A1-3 della catena di T500)
- **Estende**: ADR-0268 (le regole e le corrispondenze dell'originale), ADR-0263 (l'interruttore della semantica), ADR-0142 (il motore non
  cambia un voxel), ADR-0164 (il passo persistente), ADR-0178 (i pezzi)
- **Studio**: [`docs/design/markov-allineamento.md`](../design/markov-allineamento.md) (§ 3.2, § 8); [`docs/design/markov.md`](../design/markov.md)
  (T498: le otto differenze dei rami); la risposta 2 di [`docs/pipeline/domande/T500.md`](../pipeline/domande/T500.md) (le stranezze
  dell'originale: riprodotte)

## Contesto

Con A1-2 (T527, ADR-0268) i nodi di regola con l'interruttore acceso (`semantics: 'mj'`) sono quelli dell'originale, ma i rami erano ancora
i nostri: la corsa chiedeva sempre la radice, un `<sequence>` girava una volta e faceva ripartire ogni figlio quando lo raggiungeva, un
`<markov>` faceva ripartire tutti i figli quando lavorava l'ultimo, una `map` e una `wfc` erano il primo figlio di una sequenza col loro
resto, e dopo si andava avanti. Nell'originale (`Branch`, `MarkovNode`, `MapNode`, `WFCNode`, `Interpreter.Run`, tradotti riga per riga nel
riferimento del banco, `lab/banco/conformita/riferimento.ts`) il ramo al lavoro ha il turno (`ip.current`), un ramo che finisce lo rende al
padre con un passo che non fa niente e ricomincia da capo, e chi l'ha chiamato, chiesto di nuovo, gli chiede di nuovo dal suo inizio; un
`markov` chiede dal primo figlio a ogni passo e i passi dei figli valgono finché il ciclo finisce; la `map` e la `wfc` sono rami senza padre:
quando i loro nodi finiscono, la corsa è finita. Sono le differenze `d1`-`d5` e `d6b` di T498 e `c2` di T500.

## Decisione

1. **`OriginalBranch`** (`src/mj/engine.ts`) è il `Branch` dell'originale: va avanti dal figlio a cui era (`n`; un `markov` da capo,
   `MarkovNode.Go`), dà il turno a un figlio ramo prima di chiederglielo, torna vero col primo figlio che fa qualcosa; quando nessuno fa
   niente rende il turno (`ip.current = ip.current.parent`) e ricomincia, i figli con lui (`Branch.Reset`). I figli ripartono **solo** allora:
   gli `steps` di un figlio contano finché il ramo dura (`d1`), e la lista di un nodo di regole si rifà da capo solo lì (ADR-0268).
2. **Il turno è della corsa** (`current.branch`): la corsa chiede il ramo che ha il turno (`originalTurn`), la radice per prima; ogni turno
   è un passo, anche quello in cui un ramo finisce senza fare niente; la corsa finisce quando nessun ramo ha il turno (`finished`). La
   radice è quella dell'originale (`originalRoot`, `Interpreter.Load`): un ramo, o il nodo dentro un `markov`.
3. **La `map` e la `wfc` sono rami senza padre.** Il compilatore segna la sequenza che fa di una `map` coi suoi nodi (`grid: true`, accanto
   a `gated` della `wfc`, T335); con l'interruttore acceso quella sequenza è il ramo della `map` (il suo primo figlio è il passo della `map`)
   e una `map` o una `wfc` senza nodi è un ramo a sé, senza figli: quando i loro nodi finiscono la corsa è finita, e ciò che viene dopo nel
   ramo di sopra non gira (`c2`). Il segno non cambia niente nella nostra corsa (le chiavi delle forme vengono dal testo XML).
4. **Un'onda senza soluzione non finisce il suo ramo e tiene il turno** (`WFCNode.Go`: `n` resta −1, `ip.current` resta dov'è): il ramo di
   sopra va avanti, e al turno dopo l'onda, chiesta di nuovo, riprova sulla griglia com'è. È una stranezza dell'originale e si riproduce
   (risposta 2 di T500). L'onda a un'osservazione per passo resta di A1-5: la nostra osserva tutto in un passo.
5. **Si decide compilando.** La corsa conosce la sua semantica prima di compilare (`rootFor`): con `mj` i rami sono `OriginalBranch`, con
   `ours` sono `SequenceRunner` e `MarkovRunner` di sempre, invariati; le impronte di ADR-0142 sono quelle di prima.
6. **Il passo persistente e i pezzi.** Con l'interruttore acceso lo `Stepper` fa i turni dei rami: `advance` conta ogni turno, i passi vuoti
   dei rami compresi, tranne l'ultimo, in cui la corsa finisce (come prima conta i passi in cui si è fatto qualcosa: la corsa di `run`
   meno l'ultimo turno); `tick` ridà il turno alla radice. Un pezzo (nostro, ADR-0178) fa girare i suoi nodi come l'interprete
   dell'originale, una sequenza, ogni turno un passo del pezzo, anche l'ultimo.

## Conseguenze

- Con l'interruttore acceso sono l'originale voxel per voxel, coi passi e la fine: `d1`, `d1b`, `d2`, `d3`, `d4`, `d5` e `d6b` di T498, `c2`
  (tre semi), i quattro cicli del forte dell'autore come piccoli programmi (`l1`-`l4`, su tutti i 400 semi che l'originale ha fatto
  girare: la misura, i passi e la fine; nei test i primi 100), i piani del forte (sempre fino in cima, il ciclo che non finisce),
  RegularSAWRestart, Keys e OddScale3D (tre semi): **19 modelli 3D su 36** (`tests/mj-conformita.test.ts`, `--modelli --mj`). StrangeDungeon,
  tolti i suoi due `d` che l'originale ignora (`c1`, A1-4), è già l'originale; CarmaTower lo è col seme 1. `tests/mj-rami-originale.test.ts`
  prova contro il riferimento i rami annidati, la `prl` a moneta in tre rami in 3D, la `map` dentro un `markov` e la `map` senza nodi, la
  `wfc` che chiude la corsa e l'onda che tiene il turno, lo `Stepper` a pezzi e i pezzi.
- Ciò che resta: `d` e i nodi `path`, `convolution`, `convchain` (A1-4: `c1`, `c3`-`c7`, `c9`, `c11`, StrangeDungeon); la `wfc` a passi e
  l'inferenza (A1-5: i modelli con `wfc`). Coi rami dell'originale un nostro `path` dentro un `markov` che riesce sempre allunga la corsa
  (SeaVilla col seme 3: 36 405 passi, l'originale 1080): lo allinea A1-4.
- I tempi sui modelli di mxgmn non peggiorano (`--modelli --mj` in 69 s, 81 s prima): il `markov` non rifà più le liste dei figli a ogni
  giro.
- `lab/scripts/markov-originale.ts` (T498) non gira da prima di questo task (la sua copia del motore cerca un pezzo della `prl` che T527 ha
  cambiato); la sua copia coi rami dell'originale è superata dall'interruttore (`conformita-mj.ts --programmi --mj`), e non è riparata qui.
- Non provato: le prestazioni con l'interruttore acceso sui programmi grandi del gioco (A1-7); la stranezza dell'onda che tiene il turno
  contro il C# (provata contro la lettura del sorgente, con un tileset nostro: il riferimento non legge i nostri tileset).
- La versione del kernel non cambia: `src/kernel/` non è toccato.
- Sicurezza: nessuna superficie nuova (lo stesso motore, negli stessi posti, con gli stessi tetti).
