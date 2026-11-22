# ADR-0249 — Gli strati come regole: il programma degli strati di ogni ambiente

Data: 2026-11-22 · Stato: accettato (task T478 del backlog, la riga 5 dello studio di T459, `docs/design/terreno-3d.md` § 4.1-4.2) ·
Riferimenti: ADR-0091 punto 5 (la profondità del terreno: «il programma» lì si chiamava `sottosuolo`), ADR-0136 (la versione del kernel),
ADR-0142 (il motore deterministico), ADR-0175 (i simboli `#n`), ADR-0211 e ADR-0225 (i segni dei piani nuovi), il § 8 dello studio di T459
(l'ADR proposto, punto 4)

## Contesto

Con T418 (ADR-0091 punto 5 ridotto) gli strati del terreno sono un aspetto: per ogni colonna una bozza dal bioma della bozza procedurale e
da un hash (terra, argilla, roccia viva; sabbia compatta sotto la sabbia, fango sotto l'acqua), 4 righe nel piano. Restavano da fare il
programma dell'ambiente, il Cartografo che scrive gli strati alla Genesi e una profondità più grande. Lo studio di T459 ha misurato la via
(§ 4.1): un programma MarkovJunior 3D su S × S × D con la superficie ferma in cima costa 2,1 ms a luogo, e senza `symmetry="(xy)"`
MarkovJunior prova una regola in ogni verso del cubo: «sotto l'erba la terra» diventa «accanto all'erba la terra».

## Decisione

1. **Il programma degli strati** (`EnvironmentDef.strata`, `src/kernel/strata.ts`): ogni ambiente può avere, accanto al suo programma di
   pianta, un programma MarkovJunior in 3D (XML di `src/mj`) che dice che cosa sta sotto che cosa nei suoi luoghi. Il kernel lo fa girare
   su una griglia `S × S × (D + 1)`: lo strato in cima è **la superficie, la bozza procedurale** (la natura che c'era prima dell'ambiente: il
   programma di un lago sa che i suoi luoghi diventano acqua), il codice della bozza dove il programma lo legge, altrimenti il codice di
   base del suo bioma (`w r s g`: il mare è acqua per chi non conosce `o`), altrimenti niente; sotto, il primo valore del programma, la terra
   ancora da decidere. Le regole dicono uno strato alla volta che cosa sta sotto (`<all in="g E" out="g #1"/>`). Il kernel legge le `D`
   righe sotto la superficie: dove il programma ha scritto uno strato vale quello, **in ogni altra cella vale la bozza di T418**
   (`programStrata`), e la bozza vale in tutto il luogo se il programma non compila, non gira o finisce il tempo.
2. **Solo regole, l'alto e il basso fermi**: `one`, `all`, `prl` dentro `sequence` e `markov`, le unioni; niente `path`, `map`,
   `convolution`, `wfc`, `convchain`, `pieces`, forme, `field`, `observe` né `search`, niente file; la simmetria di ogni nodo e di ogni regola
   fra `(xy)`, `(x)`, `(y)`, `()` (la radice dice `symmetry="(xy)"`: il predefinito in 3D è il cubo intero). Al più `STRATA_LIMITS`:
   8000 caratteri, 20 000 passi (una corsa tagliata dai passi è la stessa su ogni macchina), 500 ms (una sicurezza: la corsa tagliata dal tempo
   lascia la bozza). I simboli numerati sono gli strati del seme (`#1` la terra, ADR-0175); il compilatore riceve i colori dei simboli che il
   chiamante conosce (`compileMjx(…, { colors })`): gli strati si disegnano coi colori dei loro terreni, non del programma.
3. **Il validatore lo prova come il mondo lo fa girare** (`strataProgramErrors`, dentro `validateLayout`, sulle stesse bozze di prova,
   `sampleDrafts`, con i terreni degli strati del mondo): compila come un programma degli strati, il primo valore non è uno strato né un
   codice delle bozze, finisce nei suoi passi, sotto il suolo scrive solo strati, e sulle bozze ne decide qualcuno. L'invalido torna al
   Cartografo col motivo (`<id>: strati: …`).
4. **Sei righe nei piani nuovi** (`STRATA_DEPTH` = 6, il segno `strataDepth`): un piano nuovo, anche del kernel (il blocco, il riempitivo, il
   mare aperto, il vuoto), dice come sono fatti i suoi strati e ne ha 6 righe, dal programma del suo ambiente o dalla bozza; un piano di prima
   (senza segno) tiene le sue 4 di T418 o le rifà dalla bozza (`STRATA_DEPTH_BEFORE`, `strataDepthOf`); un piano col segno che le ha perse le
   rifà uguali (il programma è deterministico dal seme del mondo e dal luogo). `readStrata` legge le due profondità; sul filo `ChunkView.strata`
   porta le righe che ha il luogo; il taglio sotto terra fa l'ultima banda della profondità del luogo (`strataRowsAt`). Un luogo ancora bozza
   ha la bozza a 6 righe. Il contratto non cambia: tutto è aggiuntivo col segno, come `vpt` e `swim` (kernel 0.10.25).
5. **Il Cartografo alla Genesi** (`genesis.strata`, `designStrata`, un compito della Genesi senza manopola): dopo gli ambienti scrive i terreni
   degli strati del mondo (4-8, una lettera maiuscola ciascuno, non `E` né il codice di un terreno, un ruolo della bozza al più una volta:
   `topsoil clay sandbed mud bedrock`, così la bozza li prende, `ownStrata`) e, per ogni ambiente, il suo programma; i programmi invalidi
   tornano una volta col motivo, per loro soli e con gli strati fermi; uno ancora invalido resta fuori e i luoghi di quell'ambiente hanno la
   bozza. Gli strati del mondo vanno in `world.terrain → strata` (senza, quelli del seme), sopra quelli del seme (`strataPalette`). La chiamata
   sta nella carta degli ambienti (`CARD_MAKERS`). Offline i modelli locali rispondono con gli strati di un mondo di pastori e il programma
   d'esempio (`STRATA_EXAMPLE`); il primo ambiente, la prima volta, senza la simmetria.
6. **Il seme**: ogni ambiente del seme ha il suo programma, sette famiglie (il borgo con l'argilla spessa e la falda dei pozzi, il bosco con le
   radici, i campi con la terra profonda, il deserto con la sabbia fino in fondo e la falda sotto l'oasi, la roccia viva sotto montagne,
   castelli e sotterranei con le vene, le acque col fango e la falda, il resto); tre strati nuovi del seme che la bozza non scrive mai: la
   falda (`6`, `aquifer`), la vena (`7`, `ore`), le radici (`8`, `roots`). Un universo che ha già i suoi ambienti li tiene come sono
   (`keepEnvironments`, ADR-0211): i programmi arrivano solo agli universi nuovi e agli ambienti nuovi che prendono dal seme.

## Conseguenze

- Gli strati diventano un concetto del Cartografo, ambiente per ambiente, con le adiacenze scritte come regole; il kernel resta il pavimento
  (la bozza dove il programma non decide, il tempo, i passi). Costo misurato: 3,5 ms a luogo per il programma del borgo (18 × 18 × 7), una
  volta, quando il luogo si pianifica; nessun costo per frame.
- I piani nuovi crescono di due righe (2 × 324 caratteri a luogo).
- Restano fuori, per S2 (riga 6 dello studio): `world.stratum_at` per Lua, il contesto del Narratore, gli strati sotto il lotto nella richiesta
  dello Scultore Architetto, le stanze dello Scenografo per strato. Il Cartografo nella corona (`cartographer.environment`) scrive un ambiente
  nuovo senza programma degli strati: i suoi luoghi hanno la bozza.

## Alternative scartate

- **La superficie dal piano** (le caselle dopo il programma di pianta): sotto una casa ciò che c'era sotto l'erba è più vero di «sotto il
  muro», e la bozza c'è anche per i piani di prima; il programma dell'ambiente sa che cosa l'ambiente fa della bozza.
- **Lettere di bioma fisse** al posto dei codici della bozza: più semplici, ma il Cartografo non distinguerebbe la neve dal prato né il mare
  dallo stagno.
- **Una profondità per luogo dalla cantina più profonda** (ADR-0091 punto 5): 6 righe fisse bastano alle cantine di oggi (al più 3) e ai
  dirupi del rilievo vero (T459 § 3), e non cambiano con le strutture.
- **Gli strati e i programmi nella chiamata dei terreni o degli ambienti**: la chiamata degli ambienti si rifà intera a ogni programma invalido;
  una chiamata a parte rimanda solo i programmi degli strati che non vanno, coi codici degli strati che il Cartografo ha appena scritto.
