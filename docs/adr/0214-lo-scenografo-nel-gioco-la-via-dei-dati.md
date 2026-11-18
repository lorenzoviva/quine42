# ADR-0214 — Lo Scenografo nel gioco, la via dei dati: le regole del tipo, i mobili della libreria, la posa del kernel

Data: 2026-11-18 · Stato: accettato (task T410 del backlog, step 30; § 10.2 di `docs/design/scenografo.md`) ·
Riferimenti: ADR-0212 (la guardia degli interni), ADR-0213 (la casa che usa la Grande), ADR-0108 (la cache delle forme), ADR-0133 (ogni
compito ha una manopola), ADR-0143 (la generazione differita), ADR-0077 (la coda degli abbonamenti), ADR-0113 (chi paga), ADR-0127 (la casa
dell'Artista e le sue squadre), ADR-0153 (la lingua interna), ADR-0136 (la versione del kernel); le misure di T303, T406 e T413 in
`docs/design/scenografo.md` § 9

## Contesto

T303 e T406 hanno misurato tre vie per gli interni degli edifici che crescono a regole e raccomandato la **via dei dati** come base: lo
Scenografo sceglie, per tipo di stanza, mobili che esistono già e quanti; il kernel li posa. Costa 1,4 centesimi a tipo su Opus (200 token in
uscita), due richieste uguali danno la stessa risposta, regge 16 su 16 al primo seme a 16 voxel per casella. T409 ha messo nel kernel la
guardia (ADR-0212), T413 ha dato alle case lo spazio della Grande (ADR-0213). Il § 10.2 chiede lo Scenografo nel gioco perché la
rigenerazione degli universi (T411) abbia case arredate.

## Decisione

1. **Un agente nuovo, `scenographer`** (lo «Scenografo», ADR-0153: l'id interno è inglese, `scenografo` si legge come lui nella tabella
   `agenti`; il ruolo è `prompts/agents/scenographer.md`, dal `prompt-dati.md` del banco). Riceve ciò che il kernel misura dell'edificio fatto
   (`describeBuilding`: per i semi 1 e 2 i piani raggiunti, la porta, le parti abitabili, le stanze col tipo, l'area, il soffitto e il
   riquadro, le aree del suolo, il posto degli animali), **mai il programma**; nelle istruzioni il catalogo (`catalogueText`). Risponde col
   compito **`interior.design`**: regole `{ storey?, area?, room?, furniture[], count }`, lo schema con gli id del catalogo come elenco;
   ciò che il kernel non sa usare torna una volta col motivo (regola 2). Usa il modello del Concilio (`ai.textModel`): la risposta è una
   scelta fra pochi id, non un programma.
2. **Il catalogo** è la libreria della classe `furniture` com'è indossata ora (`Forms.furniture`: non i mobili isolati, mai quelli della
   corona, `corona-*`, che non sono cose del mondo), al più 32; ogni mobile è il suo programma col primo seme, ritagliato a ciò che disegna e
   ricampionato alla densità dell'edificio (`pieceOf`: un mobile di una casella a 20 resta una casella in un edificio a 16), come il banco.
3. **Una risposta per tipo, come i modelli**: le regole stanno sulla voce dell'edificio in `models/index.json` (`interior: { rules, author }`),
   scritte da un commit del Concilio (`Kernel.setInterior`, `models/` è suo, ADR-0109), senza una carta loro: l'interno è parte del tipo, e
   della sua carta. Si leggono senza fidarsi (`readInterior`: id che il catalogo ha, `count` 1-6, al più 16 regole, `storey` 0-8, `room`
   nell'elenco, un'area una parola), solo su una struttura che cresce a regole.
4. **La posa è del kernel** (`src/kernel/furnish.ts`, `furnishWithRules`): le stanze dei piani sopra il suolo (`interiorRooms`, i centri
   coperti del piano dell'interno tagliati a `NARROW`; la più grande del piano è la sala, una di 1,5 caselle² o più una stanza, le altre
   piccole); la prima regola che corrisponde decide; ogni pezzo scelto a caso fra i suoi id, girato, provato sul pavimento libero contro un
   muro, mai sul posto degli animali, mai prendendo più di metà dei centri della stanza, e tenuto solo se **la guardia di T409** lo ammette.
   Prima della guardia un filtro che non ammette niente: i centri del piano senza quelli che il pezzo toglie restano in tanti pezzi quanti
   prima (la guardia cammina tutto l'edificio, 40 ms a chiamata: con il filtro la casa del borgomastro passa da 3,6 s a 0,5 s, gli stessi
   8 pezzi); al più 4 rifiuti della guardia per pezzo, e per edificio al più 64 pezzi provati e 96 chiamate alla guardia (`FURNISH_CAPS`:
   contati, non a tempo, così la stessa griglia esce su ogni macchina e un indice scritto a mano non tiene fermo un mondo di molti). La cantina resta vuota (T419). I colori dei mobili entrano nell'alfabeto dell'edificio
   una lettera per aspetto, mai oltre le 255 di una griglia. Tutto è funzione di (edificio, regole, mobili, seme): nessuna estrazione
   dall'orologio, la stessa griglia sul server e nel browser.
5. **Un edificio con l'interno è una forma**: la richiesta porta l'interno (`FormRequest.interior`: le regole, i programmi dei mobili, il
   seme dell'edificio, la cantina), `runForm` arreda l'edificio intero appena fatto (nel worker del browser, in `InlineRunner` e in
   `TurnRunner` del mondo di molti), la chiave è quella dell'interno di T409 (`interiorKey`), così la cache delle forme, quella del browser e
   quella su disco dei test la tengono da sé e l'edificio nudo tiene la sua; la fisica e il disegno leggono la stessa griglia arredata.
   `Forms.get` dà l'edificio arredato, `Forms.bare` quello nudo (per chi misura ciò che lo Scultore ha fatto); finché quello arredato non è
   pronto `Forms.ready` dà quello nudo se c'è (nessun ritorno ai sostituti); un edificio arredato che fallisce è quello nudo (regola 7).
6. **Il direttore** (`InteriorDirector`, `kernel.furnishing`): ogni pochi secondi, un edificio alla volta, i modelli propri (mai il generico
   della classe, che sta al posto di uno da scolpire) delle strutture dei luoghi caricati che crescono a regole e non hanno un interno; un
   edificio senza una stanza da arredare non si chiede. Entro **la manopola `interiors`** («Interni degli edifici», ADR-0133: una pausa come
   quella dei modelli, a 0 gli edifici restano nudi, validi e percorribili; «Low Detail» 0,34) e **16 interni per sessione**. Come lo
   Scultore e il Musicista, **non arreda da sé coi modelli locali**: offline lo si chiama a mano (la console, un test) e la risposta dei
   modelli locali è quella offline del banco (`MockAiModels`); un interno scritto da loro (`author: offline`) si richiede quando i modelli
   non sono locali.
7. **Chi paga e dove va**: `interior.design` è un compito comune (`isCommonTask`), come la scultura: lo paga chi paga il modello
   dell'edificio. È lento quanto basta per la **coda degli abbonamenti** (`slowTask`) e la **generazione differita** ha il suo passo
   (`interno:<modello>`, dopo modelli e brani). Riga del censimento, token della stima (circa 2 200 in ingresso sul forno del borgo, 220 in
   uscita come T303) e riga della stima oraria.
8. **Una postazione nello studio**: la sedia al tavolo del Concilio (undici: le sedie partono mezzo passo dal lato dell'uscita, così con un
   numero dispari nessuna le sta davanti), la squadra nella casa dell'Artista (`Building.teams`), il suo gerboa (`corona-gerboa-scenographer`,
   dal Musicista col basco e la sciarpa color legno e un lapis da falegname al posto del piffero); le direttive del master della sezione
   «Scultore e Artista»; in una conversazione nello studio non manda niente alla Fucina.
9. **Kernel 0.9.8**: un campo facoltativo in più sulle voci della libreria e una manopola che assente vale 1; gli universi della 0.9 restano
   buoni, nessuna migrazione.

## Conseguenze

- Offline, sul borgo del seme: il forno scolpito dallo Scultore offline (la villetta, 14 caselle² a terra in due stanze) e arredato dallo
  Scenografo offline ha circa 5 000 voxel di mobili a ogni seme, nessuno sull'edificio né sul protetto, i piani e le parti dello Scultore
  come prima (`tests/scenografo.test.ts`); arredare costa 0,75-1,2 s per edificio e seme, come T409 misurava.
- **Le case del borgo restano nude**: offline portano la casa generica `structure` (la «Casa a graticcio» di 4,5 caselle), il cui piano
  terra ha 1,7 caselle² coperte, sotto il piano piccolo di ADR-0212; e il generico non si arreda. Le case comuni di un mondo con la Genesi
  hanno un modello proprio (ADR-0134), abitazione della Grande dopo ADR-0213, e si arredano.
- La qualità della scelta su Flash-Lite non è misurata (il banco ha misurato Opus); il catalogo comprende anche ciò che in casa non va
  (`falo`, `cartello`), lasciato al giudizio dello Scenografo.
- Restano: la via del programma (§ 10.3), i mobili per la cantina (T419), la generazione differita al primo ingresso (§ 6: oggi l'edificio
  con l'interno è chiesto arredato dal primo caricamento).
