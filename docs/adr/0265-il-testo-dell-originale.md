# ADR-0265 — Il compilatore legge il testo di MarkovJunior di mxgmn così com'è

- **Stato**: accettato
- **Data**: 2026-11-27
- **Task**: T531 (A1-6 della catena di T500)
- **Estende**: ADR-0263 (la semantica dell'originale), ADR-0175 (i simboli `#N`), ADR-0174 (le unioni di una griglia, T335)
- **Studio**: [`docs/design/markov-allineamento.md`](../design/markov-allineamento.md) (§ 3.1, § 4, § 8); risposta 8 di
  [`docs/pipeline/domande/T500.md`](../pipeline/domande/T500.md) (le estensioni restano)

## Contesto

Il testo dei programmi dell'originale non compilava da noi in tre punti (§ 3.1 dello studio): l'originale prende ogni carattere come un
simbolo (ModernHouse ha le unioni `#`, `1`-`8`, CarmaTower `0`, `2`, `5`, `6`, `#` anche nei file delle regole, SeaVilla `6`), mentre per noi
dal contratto 0.6 un simbolo è una lettera o `#` e un numero e una cifra da sola è un errore; l'originale trova le unioni di una griglia solo
scendendo per `sequence` e `markov`, noi ovunque; l'originale legge i nomi delle simmetrie secondo la griglia (in 2D `() (x) (y) (x)(y) (xy+)
(xy)`, in 3D `() (x) (z) (xy) (xyz+) (xyz)`), noi gli stessi su ogni griglia e senza `(x)(y)` né `(xy+)`. Il laboratorio ne teneva una copia
portata a mano ai nostri simboli (`lab/mjx/official/`), e per sei modelli niente.

## Decisione

1. **`compileMjx(…, { original: true })`**: il testo è quello dell'originale, letto com'è. Non è la semantica della corsa (`semantics`,
   ADR-0263): si legge il testo dell'originale anche col motore di oggi, e un programma nostro si fa girare con `mj` senza leggerlo così.
2. **La traslitterazione all'ingresso** (`src/mj/original.ts`, `originalProgram`, `originalPort`, `originalText`): la stessa della migrazione
   0.5 → 0.6 (`programFor0_6`) dove le due si incontrano (una cifra diventa `#` e la cifra, un'unione `#` il primo segno che il programma non
   usa), e in più, per ciò che la migrazione non ha mai visto: ogni altro carattere che l'originale tiene fra i `values` e non è una lettera
   (`.`, `#`, `?`…) un simbolo numerato suo da `#10`, `[` e `]` come unioni un segno libero; gli spazi di `values` vanno, come in `Grid.Load`.
   Il porto lo decide l'XML e vale anche per i file di testo che il programma legge (le regole di CarmaTower sono nei suoi caratteri), le
   note e la riga `->` escluse. Pura e non idempotente apposta: legge il testo dell'originale, dove `#1` sono due simboli. Il riscrittore
   comune (`rewriteMjxSource`, `holdsSymbols`) passa da `src/kernel/migrations.ts` a `src/mj/source.ts`, e la migrazione lo importa.
3. **Le unioni come l'originale, le nostre ovunque come estensione.** Leggendo l'originale il compilatore guarda un'unione come `Grid.Load`:
   trovata dalla sua griglia (la radice, una `map`, una `wfc`) solo attraverso `sequence` e `markov`, mai un simbolo che la griglia ha già (un
   valore o un'altra unione della stessa griglia), solo coi valori della griglia. Ciò che l'originale rifiuta si ripara (un avviso: da noi
   vale come estensione) e con `strict` è un errore col motivo, come `c8`. Senza `original` le unioni restano come prima, ovunque.
4. **Le simmetrie**: `(x)(y)` (i due specchi del pavimento e il mezzo giro) e `(xy+)` (i quattro giri attorno a z) sono due simmetrie del
   motore (`Sym` `mirrors` e `turns`) e si leggono in tutti e due i dialetti su ogni griglia. Leggendo l'originale, sulla griglia piana valgono
   i nomi del quadrato e sulle altre quelli del cubo (il compilatore conta gli strati della radice, di ogni `map` e di ogni `wfc` come
   l'originale); un nostro nome dove l'originale non lo conosce (`(y)` in 3D, `(xyz)` in 2D) si ripara, con `strict` è un errore. Senza
   `symmetry` sulla radice l'originale prende il gruppo della sua griglia: il quadrato su una piana (`xy`), il cubo altrove; il nostro dialetto
   il cubo, come sempre.
5. **Gli errori dell'originale con `strict`** sono quelli che il compilatore vede: le unioni, le simmetrie, i doppi in `values` (già
   prima). Gli altri dei nodi (`Moore` in 3D, `path` senza `color`, `d`) sono dei task dei nodi (A1-4). Un simbolo che la palette
   dell'originale non colora (una cifra, un segno) prende un grigio con un avviso: l'originale lo carica lo stesso. I file dell'originale
   possono avere `_` nel nome (`ORIGINAL_FILE_RE`, solo per i file dati al compilatore e per `mjxIncludes(…, { original: true })`, mai per i
   nomi sul disco di un universo, che restano `MJX_FILE_RE`).

## Conseguenze

- I 36 modelli 3D del repository di mxgmn si compilano dal loro testo (`lab/banco/conformita/mxgmn/`) con `strict`, e girano tutti nel nostro
  motore; i 30 che il laboratorio ha in copia danno lo stesso programma della copia (`tests/mj-original.test.ts`). `c8` è allineato: il suo
  `it.fails` di `tests/mj-conformita.test.ts` è un `it`; i programmi delle differenze vi si leggono come testo dell'originale.
  `lab/scripts/conformita-mj.ts` fa girare il nostro motore dal testo dell'originale (non più dalla copia).
- Nessuna griglia di oggi cambia: senza `original` il compilatore dà lo stesso programma di prima (le due simmetrie nuove sono nomi in più).
  Kernel 0.10.41 (in `src/kernel/` solo lo spostamento del riscrittore; il seme lo dice in `universe.json`).
- A1-8 può portare i programmi di mxgmn negli esempi (A1-11) con `originalProgram`; l'esportazione (A1-13) è il verso opposto.
- Sicurezza: nessuna superficie nuova (nessun nome di file nuovo sul disco; il compilatore gira negli stessi posti).
