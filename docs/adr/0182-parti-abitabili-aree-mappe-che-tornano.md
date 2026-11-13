# ADR-0182 — Le parti abitabili come sottoblocchi del seme, le aree di una struttura, le `map` che tornano alla scatola

Data: 2026-11-13 · Stato: accettato (task T346 del backlog, step 30; passo 1 di D48) · Riferimenti: l'autore in chat (10/11, epoca 347,
[`docs/userchats/to-do-2026-11-10.md`](../userchats/to-do-2026-11-10.md), «Nuovo generatore edifici MJ»), D48 (`docs/pipeline/domande/T337.md`,
la raccomandazione D), ADR-0171 (`<import>`), ADR-0174 (`map` frazionaria), ADR-0176 (i tetti del mondo), ADR-0178 (la griglia a pezzi),
ADR-0179 (ciò che entra nella taglia), ADR-0160 (un programma per più taglie), il banco [`lab/banco/taglie/`](../../lab/banco/taglie/README.md)

## Contesto

L'autore ha giudicato il banco di T338 e T339: la forma che si adatta alla taglia va bene, i difetti sono nei dettagli. Nel forte
mancano le porte fra il camminamento e le torri, i merli sono irregolari lungo il perimetro, le feritoie sono sparse senza simmetria né
una casualità pensata; nella fattoria la staccionata ha blocchi cubici chiari (i cancelli di T339, assi piene alte quattro voxel), e gli
animali non sono del programma della struttura: sono del Narratore e dello Scenografo, che però devono sapere dove stanno le aree
(il pascolo, la stalla). La fattoria di T338 ha l'architettura completa (la casa a due piani, il fieno sotto la tettoia), quella di T339 i
campi irregolari che si incastrano, il recinto irregolare e una forma che cambia molto col seme: si vogliono insieme. E su D48 ha scelto
la via D: le parti abitabili come sottoblocchi provati del seme, che lo Scultore include con `<import>` invece di riscriverle, con le misure
di T338 e la `map` condivisa fra le taglie; i passi 2 e 3 (il prompt senza scheletro, il giro su Gemini) sono T354 e T355.

Tre cose lo impedivano. **Un programma con `map` teneva la sua scatola** (`withSize`, `shareableProgram`): un piano a 1/10 che risale a
×10 ha la scala della radice, ma per il kernel era «un programma che scala» e non poteva servire due taglie; e `soil` non valeva con
`map`. **Nessun sottoblocco del seme**: ogni programma riscriveva scala, porta, merli, e li sbagliava (T337). **Nessun modo di dire a chi
mette persone e animali dove vanno**: il programma disegnava le pecore.

## Decisione

1. **Le parti abitabili sono sottoblocchi del seme**, programmi di `universe/models/` inclusi con `<import file="part-…"/>` (ADR-0171):
   `part-stair` (la scala: da una striscia `T` di 16 × 11 nell'aria sopra un pavimento, scritta dal programma che include con
   `symmetry="()"`, sale verso le x grandi due voxel per uno, apre il solaio sopra la striscia e riempie sotto i gradini; l'unione `=` sono i
   pavimenti), `part-door` (la porta: dal seme `O` di 11 scritto attraverso il muro al piede, sale 30 attraverso l'unione `+` dei muri,
   architrave e stipiti `N`, assi `o`; le azioni `open`/`close` restano del programma che include), `part-battlements` (i merli: sul bordo
   di ogni cima piatta delle lettere `+`, merli di 5 e vuoti di 3, alti 6, **regolari da ogni angolo**: un angolo è sempre un merlo, dove
   due corse si incontrano i resti vanno ai merli), `part-slits` (le feritoie: sotto il centro di ogni merlo di 5, due celle sotto la
   cima, una feritoia di 1 × 6 attraverso l'unione `%`: regolari perché lo sono i merli). **Il contratto** di una parte: le lettere di chi
   include che legge (`T`, `O`, `M`) e che scrive (`k`, `N`, `o`, `M`, `U`: il programma che include dà loro il colore), le unioni `+ = %`
   che il programma che include ridefinisce con le sue lettere (la sua vince, ADR-0171), i marcatori `#90`-`#91` che sono suoi. **Da sola
   ogni parte è un modello**: costruisce la sua scena dall'origine (la lettera `S`, che un'inclusione non ha mai: quei nodi non fanno
   niente inclusi), ha `size`, `ground` e, la scala, la sua porta con le azioni, così il validatore della libreria la prova come il resto e
   `habitableParts` la misura (la scala da sola: due piani raggiunti a piedi, porta 11 × 30). Le scrive `lab/banco/taglie/parti.mjs`.
2. **Le aree di una struttura** (`src/mj/areas.ts`): una lettera della palette porta `area="pasture"` (`AREA_RE`: minuscole, cifre e `-`,
   fino a 24 caratteri; un nome sbagliato è tolto con un avviso), anche una lettera nascosta, che resta nella griglia senza vedersi;
   `areasOf(grid, palette, vpt, base)` legge lo strato del suolo casella per casella e dà a ogni casella l'area con più celle (a parità
   la prima in ordine alfabetico), `formAreas(form)` lo fa una volta per forma nel frame del modello (`Form.areas`). **Una struttura non
   disegna persone né animali**: marca le aree (`yard`, `pasture`, `barn`, `house`, `shelter`, `field`, `orchard`; `courtyard`, `keep`,
   `tower`) per chi li metterà (il Narratore, lo Scenografo di T259: un task loro). Il banco controlla che nessuna lettera della fattoria
   dica un animale (`animalLetters`).
3. **Le `map` che tornano alla scatola** (`mapsBackToBox` in `src/mj/model.ts`): un programma le cui `map`, in ordine di documento, hanno
   prodotto di scala 1 su ogni asse (un piano a `1/10 1/10 1`, poi `10 10 1`) prende la scatola che gli si dà come uno senza `map`: è
   `shareableProgram`, `withSize` gli scrive la scatola, `checkProgram` lo prova alle sue taglie, e `soil` vale (la prima `map` lo porta
   giù con `<rule in="E" out="E"/>`). Uno che resta su un'altra scala tiene la sua scatola come prima (ADR-0160). La scala del piano deve
   dividere le scatole (10 divide 100, 150 e 200).
4. **Il banco** (`lab/banco/taglie/`, `genera.mjs`): la fattoria nuova decide il piano su una griglia a 1/10 (una cella mezza casella): la
   casa e la tettoia dal centro, il cortile attorno con la strada dalla porta, la staccionata dove il terreno continua oltre il cortile
   (la strada conta; gli angoli chiusi), il fienile a lato della casa dove il cortile ha spazio, i tracciati dalla staccionata al bordo, gli
   appezzamenti fra i tracciati a incastro, ognuno di un tipo (grano, orto, frutteto, pascolo con il suo recinto unito a quello del
   cortile e i cancelli a sbarre), diversi a ogni seme; due `map` portano ai voxel (le recinzioni da centro a centro, un paletto ogni
   cinque) e il dettaglio di T338 a scala piena include `part-stair` e `part-door`. Il forte ha la cinta di 12 con il camminamento fra due
   merlature, le torri cave con il pavimento al camminamento e **la porta dal camminamento in ogni torre**, i merli e le feritoie dalle
   parti. Entrambi segnano le aree; le pecore non ci sono più.

## Alternative scartate

- **Le parti come file di regole** (`fin`/`fout`): una parte è una sequenza di nodi (la scala cresce, scava, riempie), non una regola.
- **Le parti con lettere fisse del kernel** come `<worn>` (`z o r m`): avrebbero chiesto di rinominare prima e dopo; le unioni ridefinite
  dal programma che include sono già il meccanismo di ADR-0171 e lasciano a ogni programma le sue lettere.
- **Il volume delle aree** (ogni voxel): l'area è del suolo, ed è ciò che serve a chi mette qualcuno su una casella; i pavimenti sopra
  (il piano di sopra) sono raggiungibili dalle misure di ADR-0179.
- **Gli animali come parti**: sono persone del mondo, con una routine (ADR-0166), non voxel di un edificio.

## Conseguenze

- `KERNEL_VERSION` `0.6.6`: gli universi della `0.6` restano buoni; i programmi di prima non hanno `area` né `map` che tornano, e il
  compilato non cambia (`tests/mj-engine-determinism.test.ts`). Quattro file nuovi in `universe/models/`, con la loro voce nell'indice (classe `structure`, la
  scatola loro: la libreria vuole ogni programma descritto) e validati come il resto; nessun lotto li chiede per id.
- Il prompt dello Scultore delle strutture sa delle quattro parti e delle aree (una riga ciascuna); il prompt senza scheletro è T354.
- I controlli del banco: `merlonRuns` (i merli per lunghezza: quasi tutti di 5), `animalLetters`, le aree per taglia; le foto nuove;
  `tests/structure-parts.test.ts`, `tests/structure-sizes.test.ts` con i file del seme.
- Sicurezza: nessuna superficie nuova (le parti sono file di `models/` come gli altri; `area` è un attributo letto dal compilatore, con il
  suo filtro; i tetti di ADR-0176 valgono anche qui: quattro inclusioni, profondità uno).
