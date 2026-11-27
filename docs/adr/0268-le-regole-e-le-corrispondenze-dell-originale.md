# ADR-0268 — Le regole e le corrispondenze di MarkovJunior di mxgmn: le simmetrie, la lista pigra, `one`, `all`, `prl`, i passi

- **Stato**: accettato
- **Data**: 2026-11-27
- **Task**: T527 (A1-2 della catena di T500)
- **Estende**: ADR-0263 (l'interruttore della semantica, `System.Random`), ADR-0142 (il motore non cambia un voxel), ADR-0173 (l'inferenza)
- **Studio**: [`docs/design/markov-allineamento.md`](../design/markov-allineamento.md) (§ 2.2, § 3.1, § 3.3, § 8); la risposta 4 di
  [`docs/pipeline/domande/T500.md`](../pipeline/domande/T500.md) (`p` nella `one`: come l'originale)

## Contesto

Con A1-1 (T526, ADR-0263) la corsa con l'interruttore acceso (`semantics: 'mj'`) tira da `System.Random` di .NET, ma l'ordine in cui il
motore tiene e sceglie le corrispondenze era ancora il nostro: un insieme aggiornato a ogni scrittura (ADR-0142), le varianti di una regola
nell'ordine delle permutazioni degli assi, una corrispondenza solo dove la regola cambia qualcosa, `p` che pesa la `one`, la `prl` che decide
prima e scrive dopo una sopra l'altra, un passo solo dove si è fatto qualcosa. Con lo stesso generatore, il caso dell'originale dipende da
chi tira, quando e su quale lista (§ 2.2 dello studio): A1-2 porta sotto l'interruttore le regole e le corrispondenze dell'originale, cioè
`Rule`, `SymmetryHelper`, `RuleNode`, `OneNode`, `AllNode` e `ParallelNode`, tradotti riga per riga nel riferimento del banco
(`lab/banco/conformita/riferimento.ts`).

## Decisione

1. **Le varianti di una regola nell'ordine di `SymmetryHelper`.** Le tre trasformazioni di `Rule` (`ZRotated`, il quarto di giro attorno
   a z; `YRotated`, attorno a y; `Reflected`, lo specchio di x), la lista dell'originale (`e, r, a, ra, a², …`: 8 trasformazioni del quadrato
   su una griglia piana, 48 del cubo sulle altre), quelle del sottogruppo, senza i doppi (`Rule.Same`: le stesse scatole, le stesse celle).
   I sottogruppi per nome (`SQUARE_SUBGROUPS`, `CUBE_SUBGROUPS` in `src/mj/engine.ts`): quelli dell'originale (`() (x) (y) (x)(y) (xy+)
   (xy)` sul quadrato, `() (x) (z) (xy) (xyz+) (xyz)` sul cubo); i nostri nomi per ciò che fanno là dove l'originale non li ha (sul piano
   `(z)` è niente e i giri del cubo sono il quadrato; sul cubo `(y)`, `(x)(y)` e `(xy+)` sono le stesse trasformazioni del pavimento, le prime
   8 del cubo). Il nodo le fa al suo primo passo, dagli strati della griglia su cui gira (come l'originale le fa caricandolo); così le regole
   di una `map`, dagli strati della griglia vecchia.
2. **Una corrispondenza è dove l'ingresso combacia**, anche se l'uscita non cambia niente: una `one` che non cambia niente fa un passo
   (`d7`), una `prl` che non cambia niente non finisce (`d8`).
3. **La lista pigra dell'originale** (`OriginalList`, `RuleRunner` sotto `mj`): al primo passo (e dopo un `reset`) la scansione di
   `RuleNode.Go`, regola per regola e variante per variante, le celle al passo della variante dal suo angolo lontano e, per ognuna, le
   origini dove la variante accetta quel valore (`ishifts`, nell'ordine della variante); poi, dal turno in cui il nodo ha combaciato
   l'ultima volta, intorno a ogni cella scritta da allora (una volta sola: rivista, trova ciò che ha già trovato) ciò che è nuovo, in coda,
   se la sua marca (`matchMask`) non c'è. Il turno lo dice chi fa girare i turni (`run`/`runOn`, `Stepper`, i pezzi): dove era il registro
   delle scritture quando il turno è cominciato (`current.turn`, l'`ip.first[ip.counter]` dell'originale). Della scansione si salta solo
   ciò che non trova niente, così l'ordine resta: una variante una cella della quale non ha valori sulla griglia, una riga del passo senza
   un valore che la variante accetta, una riga del passo le cui corrispondenze avrebbero tutte la loro cella più rara (l'àncora) in righe
   della griglia dove il censimento non ne conta (come fa il censimento per il nostro, ADR-0142).
4. **`one`**: `Next(n)` sulla lista, la corrispondenza esce dalla lista (l'ultima prende il suo posto) e si mette se combacia ancora, se no
   se ne tira un'altra; **`p` non si legge** (risposta 4: la scelta uniforme; la migrazione A1-8 riscrive le `one` con `p` diversi).
   **`all`**: il mescolamento «dall'interno» (`Next(i + 1)` per i da 0), ogni corrispondenza dove nessuna cella che scrive è già stata
   scritta in questo passo, l'ingresso non ricontrollato, ogni cella scritta nel registro anche se ha già il valore, la lista vuotata.
   **`prl`**: la scansione intera a ogni passo, un `NextDouble()` per corrispondenza nell'ordine della scansione (`NextDouble() > p` la
   lascia: `p="0"` non mette mai), ciò che scrive giudicato sulla griglia di prima e tenuto solo dove la cella cambia (una regola che
   scriverebbe il valore di prima non copre quella che lo cambia, `c10`), ogni giro un passo dei suoi `steps` anche se non mette niente
   (`d6`), e va avanti finché la moneta mette qualcosa.
5. **Con i campi e le osservazioni** (`GuidedRunner` sotto `mj`), gli stessi passi sulla lista: `OneNode.RandomMatch` coi potenziali (la
   lista nel suo ordine, tolte le corrispondenze che non combaciano più, un tiro per ognuna con un'euristica, la chiave più grande sopra
   −1000, la scelta che resta nella lista) e `AllNode.Go` coi potenziali (l'ordine stabile per chiave, il passo contato anche se niente
   entra, le marche delle corrispondenze senza euristica che restano); per la `prl` la scansione e i tiri prima dei campi, e se i campi la
   fermano i suoi cambi stanno nel registro e la griglia resta. Ciò che le osservazioni scrivono e la `search` restano i nostri: li allinea
   A1-5 (T530).
6. **Ogni turno è un passo** (`Interpreter.Run`): sotto `mj` la corsa conta anche l'ultimo turno, quello in cui la radice non trova niente,
   e `finished` dice che la radice ha finito. Il turno di un ramo dentro un altro (il turno che passa al ramo annidato, il suo passo vuoto
   quando finisce) è di A1-3 (T528). Il passo persistente (`Stepper.advance`) conta ancora i passi in cui si è fatto qualcosa.
7. **La memoria e il limite.** Le marche sono un byte per cella per variante, fatte quando servono (come i `bool[]` dell'originale). Il
   registro delle scritture tiene il suo tetto (2 milioni): oltre (o dopo una `map`, una `wfc`, i pezzi, che rifanno la griglia) la lista di
   un nodo si ritrova con una scansione. È l'unico punto in cui una corsa sotto `mj` lascia l'originale, che tiene ogni cambio; A1-7 (T532)
   lo misura coi tempi.
8. **Spento non cambia niente**: con `ours` nessuno di questi percorsi gira (il nodo sceglie al passo dalla semantica della corsa); le
   impronte di ADR-0142 sono quelle di prima.

## Conseguenze

- Con l'interruttore acceso il nostro motore dà la griglia dell'originale voxel per voxel, coi passi e la fine, su `d6`, `d7`, `d8`, `d9`
  (cinque semi), `d10` di T498, su `c10` (tre semi), su Growth, MazeGrowth, RegularSAW e ParallelGrowth (tre semi) e su piccoli programmi
  che provano le simmetrie del quadrato e del cubo, `all`, `prl` a moneta e `map` contro il riferimento (`tests/mj-regole-originale.test.ts`):
  i loro `it.fails` sono `it`. In più, senza che la loro riga sia ancora fatta, su altri 12 modelli 3D di mxgmn (Counting, DualRetraction3D,
  Hills, MazeTrail, NoDeadEnds, Noise, OpenCave3D, River, SoftPath, StairsPath, StochasticVoronoi, Voronoi), tenuti nei test perché nessun
  task li perda: 16 su 36.
- Ciò che resta: i rami (A1-3: `d1`-`d5`, `d6b`, il `markov` che fa ripartire i figli, OddScale3D che ha già la griglia e due passi in meno,
  Keys, RegularSAWRestart), `d` e i nodi `path`, `convolution`, `convchain` (A1-4: StrangeDungeon, `c1`-`c7`, `c9`, `c11`), la `wfc` e
  l'inferenza (A1-5: i modelli con `wfc`). `lab/scripts/conformita-mj.ts -- --modelli --mj` dice modello per modello dove siamo.
- I tempi sui modelli di mxgmn sono quelli del motore di sempre (CarmaTower 3-6 s contro 3,2-3,7 s, con più passi; SeaVilla 0,7-0,8 s
  contro 0,7 s; gli altri uguali o meno): senza il salto delle righe dell'àncora la scansione intera dell'originale, che una `prl` rifà a
  ogni richiesta e che il nostro `markov` rifà a ogni ripartenza dei figli, portava CarmaTower a 15 s.
- Non provato: le prestazioni sotto `mj` sui programmi grandi del gioco e oltre il tetto del registro (A1-7); un'unione che vale tutti i
  valori della griglia e un `*` nella stessa regola sono la stessa cella per `Rule.Same` e due per noi (nessun modello misurato li ha).
- La versione del kernel non cambia: `src/kernel/` non è toccato.
- Sicurezza: nessuna superficie nuova (lo stesso motore, negli stessi posti, con gli stessi tetti).
