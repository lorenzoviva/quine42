# ADR-0263 — La semantica di MarkovJunior di mxgmn: l'interruttore, System.Random, il criterio voxel per voxel

- **Stato**: accettato
- **Data**: 2026-11-26
- **Task**: T526 (A1-1 della catena di T500)
- **Estende**: ADR-0142 (il motore non cambia un voxel), ADR-0036 e ADR-0038 (MarkovJunior del gioco)
- **Studio**: [`docs/design/markov-allineamento.md`](../design/markov-allineamento.md) (§ 2, § 7, § 8); domande e risposte in
  [`docs/pipeline/domande/T500.md`](../pipeline/domande/T500.md)

## Contesto

Per D/T498 l'autore ha scelto **A1** (22/11): allineare il nostro motore e il compilatore a MarkovJunior di mxgmn il più possibile, per usare
i modelli del suo repository come esempi degli Scultori, per esportare i nostri programmi nell'originale con una piccola traslitterazione, e
accettando che le griglie dei programmi di oggi cambino. Lo studio di T500 ha mostrato che il caso dell'originale si riproduce: `System.Random`
di .NET con un seme (il sottrattivo di Knuth) tira in TypeScript gli stessi numeri bit per bit, e con l'ordine in cui l'originale tira la sua
traduzione riga per riga (`lab/banco/conformita/riferimento.ts`) dà la griglia del C# su 30 dei 36 modelli 3D, sui programmi delle differenze e
sull'esempio del borgo. Il 26/11 l'autore ha risposto alle domande 1-3 di T500: **(1) il criterio è voxel per voxel**, eccetto dove divergiamo
apposta; **(2) le stranezze dell'originale si riproducono**, con la `wfc` come proposto; **(3) gli universi di oggi si portano** al contratto
nuovo (0.11) con la migrazione.

## Decisione

1. **La scelta A1.** Il motore di MarkovJunior del gioco (`src/mj/engine.ts`, `src/mj/model.ts`) segue la semantica dell'originale: gli stessi
   nodi e attributi con lo stesso senso, lo stesso generatore e lo stesso ordine di ogni estrazione. Le nostre estensioni (le forme, `pieces`,
   `import`, `#N`, `[..]`, `ground`/`soil`, `clear`, i tetti del mondo, `Stepper`, la traccia, `<worn>`, `area`) restano dove l'originale non
   dice niente (risposta 8).
2. **Il criterio di conformità è voxel per voxel**: lo stesso programma, la stessa griglia di partenza e lo stesso seme danno nei due motori la
   stessa griglia, gli stessi passi e la stessa fine. L'oracolo è il C# dove c'è (`lab/scripts/conformita-mj.ts`), `uscite.json` e il
   riferimento nei test; il riferimento ha il suo `System.Random` (`lab/banco/conformita/dotnet-random.ts`), separato da quello del motore,
   perché l'oracolo non si appoggi a ciò che prova. Le stranezze dell'originale (la `convolution` fuori dalla lista dei cambi, la `prl` che
   non finisce, `path` che ridisegna) si riproducono; i programmi che non finirebbero li ferma il validatore col motivo (A1-9).
3. **Dove divergiamo apposta**, e l'esportazione lo dice:
   - **la `wfc`** (risposte 1 e 2: «A eccetto dove i nostri divergono, la WFC»): i passi seguono l'originale (il seme buono, poi
     un'osservazione per passo, poi i nodi dentro e la corsa finita), ma restano nostre le due correzioni dello studio (§ 3.6): la
     contraddizione si guarda su ogni cella e non sulla sola cella 0, e la `wfc` a sovrapposizione conta le finestre sulla misura del campione.
     A1-5 misura quali dei modelli del repository ne dipendono: se uno dei 30 che oggi il riferimento dà come il C# cambia griglia per
     queste due, lo dice all'autore prima di chiudere (la lettura opposta della risposta 2, riprodurre anche queste, è un interruttore del
     riferimento e non cambia il resto della catena);
   - **i valori di una griglia**: al più 255 (`MAX_SYMBOLS`, ADR-0175), non 31; un programma con più di 31 valori non si esporta;
   - **`search` in 3D**: è nostra (l'originale la fa solo in 2D); in 2D si allinea (A1-5);
   - le estensioni del punto 1.
4. **L'interruttore, non due motori** (§ 7 dello studio). `Semantics = 'ours' | 'mj'` (`src/mj/random.ts`): `ours` è il motore di sempre,
   `mj` la semantica dell'originale. Il compilatore la scrive solo se gli si chiede (`compileMjx(…, { semantics: 'mj' })` mette
   `Program3.semantics`, anche sulle animazioni e sulle azioni); la corsa la prende da `RunOptions.semantics`, poi dal programma, poi `ours`
   (`semanticsOf`); `run`, `runOn` e `Stepper` la seguono e i nodi la leggono dalla corsa in corso (`runSemantics()`). **È spenta per ogni
   programma di oggi**: nessuno la chiede fino alla migrazione (A1-8), che la accende per il contratto 0.11; il flusso di prima si toglie quando
   nessun universo lo usa più. Fino ad allora ogni task della catena allinea una famiglia di nodi sotto `mj`, gira i suoi `it.fails` di
   conformità in `it` sotto l'interruttore e non cambia una griglia di `ours` (`tests/mj-engine-determinism.test.ts`, ADR-0142, regge fino in
   fondo).
5. **Il generatore della corsa** (`RunRandom`): `next()` è `NextDouble()`, `int(n)` è `Next(n)`, `seed()` è `Next()`, `spawn(seed)` un
   generatore dello stesso tipo. Con `ours` è `Rng` (mulberry32, `src/kernel/rng.ts`), con `seed()` = `int(0x7fffffff)` e `spawn` = `new Rng`,
   cioè le estrazioni di prima; con `mj` è `SystemRandom` (`src/mj/random.ts`) col seme della corsa (`new Random(seed)` di
   `Interpreter.Run`; un seme oltre 2³¹ − 1 è lo stesso `int` di C#). I generatori propri nascono da un `Next()` della corsa come
   nell'originale: la `wfc` per tentativo (`new Random(ip.random.Next())`), la `search`, e i `pieces` (nostri) da un `Next()` e dal numero
   del pezzo. `path` prende il suo generatore con A1-4, che rifà il nodo.
6. **Il primo passo provato**: dove il nostro ordine delle corrispondenze è già quello dell'originale (una regola su una riga, `one` e `prl`)
   la corsa con `mj` dà la griglia del riferimento voxel per voxel (`tests/mj-random.test.ts`); il resto dell'ordine (le varianti di
   `SymmetryHelper`, la lista delle corrispondenze, i rami) è di A1-2 e A1-3.

## Conseguenze

- Nessuna griglia di oggi cambia: le impronte di `tests/fixtures/mj-engine-hashes.json` sono quelle di prima, la cache delle forme non
  cambia chiave (il campo `semantics` c'è solo quando è `mj`). Kernel 0.10.39 (in `src/kernel/` solo `Rng.seed`/`Rng.spawn`, che estraggono
  come prima).
- `WfcSolver.solve` e `search` di `src/mj/infer.ts` ricevono il generatore (`RunRandom`) e non più un seme numerico.
- La catena: A1-2 … A1-5 allineano i nodi sotto `mj`, A1-6 il compilatore, A1-8 accende l'interruttore col contratto 0.11 e la migrazione.
- Sicurezza: nessuna superficie nuova (il motore gira negli stessi posti, con gli stessi tetti).
