# ADR-0274 — `map`, `path`, `convolution`, `convchain` di MarkovJunior di mxgmn, e `d` ignorato

- **Stato**: accettato
- **Data**: 2026-11-27
- **Task**: T529 (A1-4 della catena di T500)
- **Estende**: ADR-0273 (i rami dell'originale), ADR-0268 (le regole e le corrispondenze dell'originale), ADR-0265 (il testo
  dell'originale), ADR-0263 (l'interruttore della semantica), ADR-0142 (il motore non cambia un voxel), ADR-0240 (`convchain` strato per strato)
- **Studio**: [`docs/design/markov-allineamento.md`](../design/markov-allineamento.md) (§ 3.1, § 3.5, § 8); la risposta 2 di
  [`docs/pipeline/domande/T500.md`](../pipeline/domande/T500.md) (le stranezze dell'originale: riprodotte)

## Contesto

Con A1-3 (T528, ADR-0273) i rami e i nodi di regola con l'interruttore acceso (`semantics: 'mj'`) sono quelli dell'originale, ma i nodi che
non sono regole erano ancora i nostri, e il compilatore saltava ancora i nodi con `d="2"`. Le differenze, ognuna con un programma e ciò che il
C# vi ha stampato (`lab/banco/conformita/programmi/`, `uscite.json`): l'originale ignora `d` (`c1`); `path` parte dal `from` più vicino
all'arrivo con un generatore suo (`c3`), senza `color` disegna col primo simbolo di `from` (`c4`, e riesce ogni volta che una partenza è
raggiunta, anche senza disegnare: in una sequenza non finisce), va anche per spigoli e vertici (`c11`); la `convolution` fa i passi che dice
e non al più 30 (`c5`), conosce VonNeumann e Moore su una griglia piana e VonNeumann e NoCorners sulle altre (`c6`: Moore in 3D non la
carica; `c9`: la nostra contava su una griglia piana e periodica ogni vicino tre volte), e ciò che scrive non va nella lista dei cambi (`c7`);
`convchain` nemmeno. La `map` era già dell'originale (la griglia nuova vuota, le regole che girano attorno ai bordi, le varianti di
`SymmetryHelper` da T527, il ramo che chiude la corsa da T528).

## Decisione

1. **`d` si ignora** con l'interruttore acceso: il compilatore (`compileMjx(…, { semantics: 'mj' })`, `Compiler.mj`) legge i nodi e le
   regole con `d="2"`, come l'originale; con `ours` li salta come sempre.
2. **`path` è `PathNode`** (`PathRunner.goOriginal`): le distanze dagli arrivi sulle celle `on`, che raggiungono anche le partenze senza
   proseguire da loro; per facce nell'ordine dell'originale (−x, +x, −y, +y, −z, +z), con `edges` anche per spigoli e con `vertices` per
   vertici in 3D (`directions`); con una partenza raggiunta un generatore suo (`new Random(ip.random.Next())`, `rng.spawn(rng.seed())`)
   tira un rumore di 0,1 per ogni partenza raggiunta, nell'ordine della griglia, e la penna parte dalla più vicina (`longest`: la più
   lontana); scende una distanza alla volta (`step`: per facce con `inertia` dritta se può, altrimenti una a caso con `Next(n)`; per spigoli
   con `inertia` la più allineata col rumore), ogni cella scritta col colore e messa nella lista dei cambi anche se lo era già
   (`writeLogged`); **riesce ogni volta che una partenza è raggiunta**, anche senza disegnare. Senza `color` il compilatore prende il primo
   simbolo di `from`; `edges` e `vertices` entrano nel nodo. Una partenza che è anche un arrivo, nell'originale, fa cadere la penna fuori
   dalle distanze e la corsa si ferma con un errore: da noi un `Mj3Error` col motivo. Il nostro `steps` su `path` resta un'estensione.
3. **`convolution` è `ConvolutionNode`** (`ConvRunner.goOriginal`): i passi che dice, senza `steps` finché cambia (nessun tetto: un automa
   che sfarfalla gira fino ai passi della corsa); ogni passo contato, anche quello che non cambia niente (e torna falso); su una griglia
   piana i vicini dello strato (i kernel 2D: VonNeumann 4, Moore 8), sulle altre quelli del cubo (VonNeumann 6, NoCorners 18), ognuno
   una volta, i bordi che girano una volta per asse con `periodic`; per ogni cella nell'ordine della griglia la prima regola il cui
   ingresso è la cella, la cui uscita non lo è, la cui moneta (`Next() < p·(2³¹ − 1)`, tirata solo se `p` non è 1) e la cui somma dei
   valori elencati (ognuno tante volte quante è scritto) dicono sì.
4. **I vicinati che l'originale non carica** (Moore su una griglia di più strati, NoCorners su una piana) e **`convchain` su più strati**:
   con `strict` un errore come nell'originale; senza, una riparazione con l'avviso che tiene i nostri (Moore coi 26 del cubo, NoCorners con
   gli 8 dello strato, `convchain` strato per strato, ADR-0240). La migrazione (A1-8) sceglierà per i programmi degli universi.
5. **Ciò che `convolution` e `convchain` scrivono non va nella lista dei cambi** dell'originale (`ip.changes`): il registro della griglia
   li tiene (la traccia li vede), ma i tratti del registro che scrivono sono segnati (`Grid3.unseen`, `unseenFrom`) e la lista di un nodo di
   regole che ha già cercato li salta (`catchUp`): non li vede finché qualcos'altro non cambia lì o finché non cerca di nuovo da capo.
6. **`convchain` senza celle `on`**: il primo passo conta e torna falso, e i passi dopo spazzano una griglia senza niente da cambiare,
   tirando i numeri e tornando veri, come l'originale (su una griglia piana; sulle altre, nostre, non tirano).
7. **Si decide compilando e correndo, sempre dall'interruttore**: con `ours` niente di questo gira (le impronte di ADR-0142 non cambiano, il
   compilatore salta `d`, vuole `color`, avvisa di `edges`).

## Conseguenze

- Con l'interruttore acceso tutti gli 11 casi delle differenze (`c1`-`c11`) sono l'originale su tre semi, anche gli errori, e così
  StrangeDungeon (i suoi due `d`) e CarmaTower (cinque `path` e due `convolution`): **21 modelli 3D su 36** voxel per voxel, coi passi e
  la fine (`tests/mj-conformita.test.ts`, `--modelli --mj`). I 14 modelli con la `wfc` (SeaVilla e ModernHouse coi loro `path`, `field` e
  `map` compresi) hanno già la griglia dell'originale voxel per voxel sui tre semi, coi passi di meno: l'onda a un'osservazione per passo è di
  A1-5; SubmergedKnots si ferma ai 50 000 passi della corsa, e coi passi di meno arriva a un'altra griglia.
- `tests/mj-nodi-originale.test.ts` prova contro il riferimento `path` per facce, spigoli e vertici, con `inertia` e `longest`, in 2D e in
  3D, ripetuto e in un ciclo; `path` senza `color`; la `convolution` NoCorners periodica in 3D con le monete, i valori ripetuti, Moore
  periodica in 2D finché cambia, la moneta oltre 1; ciò che la `convolution` e `convchain` scrivono fuori dalla lista; `convchain` senza celle
  `on`; ChainDungeon e ChainDungeonMaze del repository; `d` sui nodi e sulle regole; il borgo coi sentieri è la griglia del C#.
- Ciò che resta: la `wfc` a passi e l'inferenza (A1-5); le prestazioni (A1-7): `path` con l'interruttore acceso tiene le distanze fra un
  passo e l'altro, la `convolution` conta i vicini solo dove serve.
- `lab/scripts/markov-originale.ts` resta rotto da T527 (la sua copia del motore è superata dall'interruttore).
- La versione del kernel non cambia: `src/kernel/` non è toccato.
- Sicurezza: nessuna superficie nuova (lo stesso motore, negli stessi posti, con gli stessi tetti).
