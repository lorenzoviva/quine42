# ADR-0091 — I sotterranei

Data: 2026-10-30 · Stato: accettato, attuato in parte (progetto di T52a; T52b, il buco a copertura di T415, T52e senza strati di T416, T52d ridotto di T418 e T52f di T417 fatti; codice ancora in T52c e nel resto di T52d: il Cartografo degli strati, il programma `sottosuolo`, la profondità dalla cantina) · Riferimenti: Regola 10,
ADR-0043 (lotti, strutture, rampe di T53a, piani di T53b), ADR-0048 (il rilievo), ADR-0049 (gli edifici della corona come modelli),
ADR-0059 (il client sottile), ADR-0080 (il salto)

## Contesto
Oggi nulla sta sotto il livello del terreno: il rilievo è una colonna piena (ADR-0048), ogni modello sta sul suolo sotto il suo
centro (`floorAt`), il renderer taglia solo la struttura in cui si è, sopra il piano in cui si è. L'autore vuole i sotterranei
(risposte del 30/10 in `docs/pipeline/domande/T52.md`):

- **parti sotterranee delle strutture** (cantine, cripte): il modello scende sotto lo zero e il terreno si taglia; forse poi anche
  luoghi sotterranei collegati, **mai** un dungeon a parte da solo, perché uno spazio che non sta davvero sotto il mondo rompe la
  coerenza visiva della simulazione;
- la **profondità del terreno** si genera con lo stesso meccanismo con cui il Cartografo genera su X e Y (bozza → programma → piano),
  limitata a poche caselle sotto la più profonda che si vede;
- nella corona la coerenza non serve (luogo mistico, «più grande dentro»): dell'edificio seminterrato (la Sala sistemi) cambia solo
  l'**esterno**.

## Decisione

1. **Uno spazio sotterraneo è il pezzo di una struttura sotto il suolo.** Non c'è una zona nuova né un mondo sotto il mondo: il
   modello di una struttura può avere `sotto: N` caselle (1 o 2; 3 per le `importante`) sotto il piano del suo lotto, e ci si scende
   con le rampe di T53a. Più strutture vicine con cantine non si collegano tra loro (i luoghi sotterranei collegati, la (c)
   dell'autore, sono un passo successivo, da decidere dopo aver visto le cantine).

2. **Il modello che scende** (T52b). La voce del modello in `models/index.json` dice `sotto: N` (come `vpt` e `tempo`): gli ultimi
   `N · vpt` strati di voxel in basso stanno sotto il suolo. Il programma non cambia forma: la scatola della classe si allunga di
   `N` caselle in basso, e lo Scultore sa che quegli strati sono la cantina (pareti, pavimento, una scala che scende dal piano terra).
   La forma lo porta in `Form.base` (voxel sotto il suolo). Dove oggi il kernel fa `groundAt(s.x, s.y) + f / vpt` farà
   `groundAt(s.x, s.y) + (f − base) / vpt`: `floorAt`, `structureAt`, `topUnder` (il salto: ciò che sta sotto il suolo non si
   scavalca né conta), i pavimenti di T53b (`Form.levels`, `pos.z`, `settleHeights`), il posare il modello nel renderer. In
   `bodyGround` il suolo, da cui si raggiungono i pavimenti, è all'altezza `base`, non 0; in `rampBlocks` le colonne fuori dal modello
   hanno il pavimento `base`. Così la collisione viene da sola: dalla cantina si esce solo per la scala, perché tra il pavimento della
   cantina e il suolo attorno c'è un dislivello oltre un gradino. Un pavimento può stare sotto il suolo (altezze negative): `pos.z`
   lo porta.

3. **Collisione e connettività** (Regola 10). Il controllo del modello (`check.ts` e la prova del kernel prima di metterlo in
   libreria) per un modello con `sotto` chiede che **ogni pavimento sotto il suolo dove sta un corpo si raggiunga dal piano terra**
   (il riempimento di `bodyGround`); altrimenti torna allo Scultore col motivo, e se ancora non regge il modello entra **senza**
   cantina (`sotto` tolto, gli strati sotto il suolo scartati) e ciò che il piano voleva sotto va `dentro`. Il terreno attorno resta
   pieno: nulla si scava fuori dal modello.

4. **Chi lo chiede** (T52f). Il Cartografo, per ogni struttura del piano, può dire `sotto: true` («la cantina del mulino», «la cripta
   del tempio») e mettere cose in una lista `sotto` del piano (botti, sarcofagi), come `dentro`/`fuori`/`ovunque`. Il kernel chiede al
   `ModelDirector` il modello `struttura-<concetto>` con `sotto` (1, 2 per le `importante`), e lo Scultore riceve nel compito la cantina
   da scolpire. Le cose `sotto` vanno sui pavimenti sotto il suolo raggiunti dalla porta (come `placeInside` sul piano terra; niente
   cose solide su punti di articolazione, ADR-0064); senza cantina, `dentro`. I modelli comuni (`edificio`, `grande`) restano senza.
   Schema Gemini, `MockModels` (un piano offline ogni tanto con una cantina, e un modello di prova con la scala) e prompt del
   Cartografo e dello Scultore come ogni compito nuovo.

5. **La profondità del terreno** (T52d), come su X e Y:
   - **i terreni degli strati**: alla Genesi il Cartografo scrive, con gli altri terreni, da 2 a 4 terreni con `layer: 'strato'`
     (terra, argilla, roccia viva, radici…), con il Fisico come gli altri; il seme ne ha di predefiniti per gli universi vecchi;
   - **la bozza**: per ogni colonna del chunk, dalla casella in superficie e dal bioma della bozza, il kernel scrive in modo
     deterministico una colonna di strati sotto di lei (terra sotto l'erba, fango sotto l'acqua, roccia sotto la roccia e più in basso);
   - **il programma**: ogni ambiente può avere un secondo programma, `sottosuolo` (MarkovJunior 3D sulla scatola `S × S × D` con lo
     strato in cima congelato, come il bordo del programma su X e Y), scritto dal Cartografo con gli ambienti e provato sulle bozze
     di prova (`sampleDrafts`); senza programma vale la bozza;
   - **il piano**: il risultato va nel piano del luogo (`maps/`, campo `strati`: `D` righe di `S × S` codici, dalla prima casella sotto
     il suolo in giù) quando il luogo si pianifica; i piani vecchi lo ricalcolano dalla bozza (deterministico, non si salva).
   - **Quanto in basso**: `D` è la profondità della cantina più profonda del chunk più `PROFONDO` (2 caselle), al più 6; senza
     cantine `PROFONDO`. Le caselle sono intere (un cubo per casella e profondità): gli strati si vedono solo sui tagli.
   Il client sottile riceve gli strati con il luogo (`PlaceView.strati`); i terreni `strato` vanno con i manifest (già in `playerFiles`).

6. **Come si vede** (T52e).
   - **Il buco**: dove un modello ha voxel sotto il suolo, la colonna del terreno di quella casella non scende sotto il suolo (il
     renderer la accorcia), così le pareti della cantina non si incrociano con il rilievo. Le facce del terreno verso il buco hanno le
     bande degli strati.
   - **Il taglio**: quando il viandante sta sotto il suolo (il suo pavimento più di un gradino sotto `groundAt`, `kernel.underground()`),
     tutto ciò che sta sopra `1,15 + floorAt` si taglia, come oggi la struttura in cui si è, ma in un **disco di caselle** attorno a lui
     (raggio 6, allungato verso la camera): terreno, strutture e cose. Il taglio del terreno è **a caselle**, non un piano nello shader:
     le colonne del disco si fermano all'altezza del taglio e mostrano in cima lo strato a cui arrivano, le colonne fuori dal disco
     mostrano sui fianchi verso il disco le bande degli strati. Una mesh piccola (il disco) si rifà quando il viandante cambia casella
     sotto terra; niente buchi che fanno vedere l'interno vuoto delle colonne.
   - **La luce**: sotto il suolo il sole e il cielo si attenuano con la profondità (al più a un terzo), restano le luci dei componenti
     `luce` e i voxel luminosi (ADR-0046): torce e candele nelle cripte le chiede il prompt dello Scultore.
   - Il taglio del bordo del cerchio quando la corona si vede (ADR-0009) può mostrare gli strati sui fianchi dell'altopiano: facoltativo.

7. **La corona** (T52c). Un edificio con `sotto` in `models/index.json` (`corona-<id>.xml`) scende sotto il viale: `placeStructure`
   lo posa `sotto` caselle più in basso, il suolo del campus si apre dove il modello ha voxel sotto lo zero (un cortile ribassato,
   una scalinata che scende al portale) e la collisione segue i voxel come al punto 2. La corona non ha strati (il fianco del buco è
   nel modello, neon e metallo): niente bozza né programma sotto il campus. L'interno resta com'è: la porta teletrasporta.

8. **Multigiocatore.** Nulla di nuovo nel protocollo oltre `PlaceView.strati`: `sotto` sta in `models/index.json` (che i giocatori
   ricevono), `pos.z` di T53b porta anche le altezze negative. Ogni client calcola buco, taglio e luce da sé.

## Attuazione

- **T52b** (il modello che scende, punti 2-3). `sottoOf(info)` legge `sotto` (1-3) dalla voce; la scatola della classe
  cresce di `sotto · vpt` voxel in basso (un programma con la sua `size` la tiene), `Form.base` sono quei voxel. Le colonne
  del modello con voxel sotto il suolo sono la cantina (`holesOf`, `Form.hole`); sulle altre la terra è piena fino a `base`
  (`surfaces` con `fill`), così il suolo attorno e il pavimento dei piani sono a `base` e la cantina, più di un gradino sotto,
  si raggiunge solo per la scala. `groundOfForm` tiene la cantina se un corpo vi sta e ogni pavimento sotto il suolo dove
  potrebbe stare è raggiunto dal piano terra; altrimenti `Form.hole` manca (la cantina resta dentro la terra, il modello è
  comunque posato più in basso perché i voxel di sopra stiano sul suolo). Diverso dal previsto: il controllo sta nella forma
  (a ogni esecuzione, anche nei client) e non torna allo Scultore: lo farà T52f, che chiede le cantine. I programmi della libreria
  portano sempre `size` sulla radice (`withSize`, il validatore la chiede): la cantina sono allora i voxel più bassi della loro
  scatola, e T52f farà scrivere a `withSize` la scatola della classe più `sotto · vpt` in basso. Nel kernel `levelIn`
  aggiunge `base`, `floorAt` sulle colonne della cantina non prende il terreno, `rampBlocks` fa aria della tromba delle scale
  (nessun pavimento entro un gradino dai piedi), `floorBelow` e `topUnder` non vedono ciò che sta sotto il suolo (il salto non
  entra), `interiorPoints` non mette cose sopra la tromba. Nel renderer `kernel.sunk(id)` abbassa il modello e
  `kernel.holesIn(chunk)` dà le caselle il cui centro cade su una colonna della cantina, con la profondità: il terreno lì scende
  al fondo del modello e i fianchi delle caselle vicine fanno le pareti del buco (senza strati, T52e). Test in
  `tests/cellar.test.ts`.
- **T415** (il buco a copertura): il terreno si apre su tutta l'impronta della cantina, a sotto-celle di 1/16 di casella
  (`holeCover`, `HOLE_CELLS`), non solo sulle caselle col centro sulla cantina (`docs/design/sotterranei-stato.md` § 6).
- **T416** (T52e senza strati, punto 6). `kernel.underground(at?)` dice se il viandante (o il punto, con l'altezza dei piedi) sta
  sotto il suolo: il pavimento (`floorAt`) più di `UNDER_STEP` = 0,2 caselle (un gradino) sotto `groundAt`; dà l'altezza del taglio
  (`cut` = pavimento + `CUT_ABOVE` 1,15), la profondità e la casella. Il disco sta in `src/kernel/underground.ts`, funzioni pure a
  numeri interi: una casella a `(dx, dy)` da quella del viandante è nel disco se dista al più `CUT_RADIUS` = 6 dal segmento lungo
  `CUT_STRETCH` = 3 caselle verso la camera (`inCutDisc`, una capsula; `towardsCamera` arrotonda l'angolo della camera al quarto più
  vicino, così il disco cambia solo a ogni quarto di giro). Il taglio è in due parti. Gli shader dei materiali della simulazione
  (`clipped`, anche quello degli id dell'inchiostro) scartano ciò che sta sopra `cut` nelle caselle del disco: terreno, strutture,
  alberi, cose, persone, rune; un frammento conta per la casella della sua faccia (spostato di 0,01 contro la normale), così il fianco
  tra due caselle si taglia con la sua. Una mesh piccola (`buildCut`) mette i tappi: ogni casella del disco col piano sopra il taglio
  ha un tappo di terra (`CUT_EARTH`) all'altezza del taglio, sulle sole sotto-celle sopra di esso dove una cantina apre parte della
  casella, e le caselle attorno al disco hanno il fianco verso il disco fino al taglio: si vedono le colonne tagliate, mai il loro
  interno vuoto. Si rifà quando cambiano casella, taglio, verso o i luoghi sotto il disco (`cutSig`). Il viandante e ciò che porta
  (`MAT.corona`) non si tagliano; le ombre restano (la profondità delle ombre non ha il taglio: la casa sopra la cantina la ombreggia).
  Il sole e il cielo si attenuano con la profondità fino a un terzo a 2 caselle (`dimAt`), con un passaggio dolce; le luci delle cose
  restano. Il disco non tocca la corona e non aggiunge niente a ciò che si disegna (regola 8): toglie soltanto, ed è spento negli interni
  dello studio e fuori dalla simulazione. Diverso dal previsto: le colonne tagliate hanno un solo colore di terra (le bande degli strati
  le aggiunge T418, con T52d); il disco è allungato verso la camera a quarti, non con l'angolo esatto. Con le cantine del seme (pavimento
  a −1,19 caselle) il taglio cade 4 centesimi sotto il suolo: il disco è un cerchio di terra attorno alla cantina e tutto ciò che vi sta
  sopra sparisce.
- **T418** (T52d ridotto, punto 5, e le bande del punto 6; kernel 0.9.5). I terreni degli strati non stanno fra le caselle (`tiles`):
  sono `strata` del generatore, codice → terreno con `layer: 'stratum'` (che il validatore vuole lì e mai in `tiles`), così nessuno
  li sceglie per una casella, nessun prompt li elenca come terreni delle mappe e la Genesi, che riscrive solo `tiles`, non li tocca. Il seme
  ne ha cinque (`SEED_STRATA` in `src/kernel/strata.ts`, gli stessi nel manifest di `world.terrain`): terra, argilla, sabbia compatta,
  fango, roccia viva; un universo senza i suoi ha quelli del seme, e quelli che ha vanno sopra codice per codice (`strataPalette`). La bozza
  cerca gli strati per `id` (`topsoil`, `clay`, `sandbed`, `mud`, `bedrock`; `roleCodes`): una colonna, dal codice della sua casella
  nella bozza procedurale (il bioma: acqua e mare, roccia e montagna, sabbia, il resto) e da un hash della casella e del seme del mondo, ha
  terra per una o due caselle, argilla e la roccia viva da due o tre; sabbia compatta sotto la sabbia, fango sotto l'acqua (la roccia una
  casella più giù), roccia viva sotto la roccia (`columnRoles`, `draftStrata`). Il piano tiene `strata`: `STRATA_DEPTH` = 4 righe di
  `S × S` codici, la prima la prima casella sotto il suolo, scritte quando il luogo si pianifica (anche i luoghi di un blocco e i riempitivi);
  un piano di prima non le ha e le ricalcola dalla bozza (`Kernel.strataOf`, tenute sul luogo, non salvate); ciò che si legge da un piano o
  dal filo passa da `readStrata` (righe intere, codici degli strati). `ChunkView.strata` le porta al client sottile la prima volta che
  riceve il luogo e quando cambiano (da quelle della bozza a quelle del piano), non a ogni versione: il client le tiene.
  `kernel.stratumAt(x, y, profondità)` dà il terreno della riga in cui cade la profondità sotto il suolo della colonna (l'ultima più giù,
  la prima sopra il suolo). Nel taglio i tappi hanno il colore dello strato a cui la colonna arriva all'altezza del taglio, e i fianchi delle
  colonne attorno al disco sono a bande, una per riga di strato, col colore dello strato della colonna (`strataSide`); ogni cambio di colore
  ha la sua linea d'inchiostro. Diverso dal previsto: niente Cartografo che scrive gli strati alla Genesi né programma `sottosuolo`
  dell'ambiente (un task dopo, se servirà: la bozza basta a dare le bande); `D` fisso a 4 righe, non la cantina più profonda più 2
  (le cantine del seme scendono di al più 3 caselle, e sotto l'ultima riga vale l'ultima); la bozza guarda la bozza procedurale e non le
  caselle dell'ambiente, così il client sottile non deve ricavarla e un lago che l'ambiente scava resta sopra la terra; i fianchi del buco
  della cantina restano di un colore (i muri della cantina li coprono). Con le cantine del seme il taglio cade appena sotto il suolo:
  i tappi sono della prima riga, la terra (o fango, roccia, sabbia dove la bozza lo dice), e le bande si vedono dove il terreno attorno al
  disco sta più in alto del taglio di più di una casella (un pendio, una cantina più profonda).

- **T417** (T52f, punto 4; kernel 0.9.6). Il piano: `structures[].cellar` (`PlanStructure`, letto solo se vero, `readStructure`; nello schema del Cartografo `cellar: BOOLEAN`) e un quarto «dove», `under` (`Where`, `WHERE`; `sotto` per chi scrive ancora in italiano), nel prompt «ogni tanto», con le cose che vanno giù; il validatore del piano tiene `cellar` solo vero e porta `under` a `inside` se nessuna struttura del piano ha la cantina. Il lotto passa la cantina al componente `structure` (`cellar`: `cellarFor`, 1 casella, 2 per le taglie rare; solo per una struttura che cresce a regole, `hasCellar`: un lotto piccolo, un edificio, resta senza) e il `ModelDirector` la chiede (`SculptRequest.cellar`, «with a cellar under it»); il riuso (T349) offre solo modelli che ne hanno una e mai le parti del seme. Lo Scultore: la richiesta dice la cantina (`cellarLine`: `cellar · 20` voxel, 1,25 caselle a 16 vpx, il suolo a `z = base`, la parte da includere), il prompt delle strutture non cresce (solo le lettere `D V` fra quelle delle parti); una parte del seme nuova, `part-cellar` (`lab/banco/taglie/parti.mjs`, la voce con `cellar: 1` per provarla da sola): chi la include segna `D` sotto il pavimento di una stanza sul suolo, la parte scende fino al fondo della scatola (`D` il pavimento, `V` i muri di due), mette lungo il muro davanti (+y) una scala che sale verso +x a pedate di 5 e alzate di 3 fino al pavimento di sopra e apre quel pavimento dove le pedate ci arrivano entro 10 voxel; senza spazio sotto il suolo non fa niente, così lo stesso programma serve una voce con la cantina e una senza. I controlli dello Scultore girano nella scatola più bassa di `base` voxel (`checkProgram(…, cellar)`, `cellarOfRequest`, `analyse` con `base`: ciò che poggia sul suolo è a terra) e vogliono la cantina che regge (`groundOfForm`) e che si raggiunge a piedi dalla porta (`habitableParts().cellar`, `cellarStoreys`: almeno un corpo di pavimento sotto il suolo, perché una cantina è più piccola di un piano); `reachableStoreys` e i piani di `habitableParts` non contano più la cantina (`aboveGround`, ADR-0162: una casa di un piano con la cantina è di un piano). Il motivo `cantina: …` torna allo Scultore col suo significato (`withMeaning`); se all'ultima prova è l'unico, lo stesso programma senza cantina passa e la struttura entra senza (`cellarOnly`, `cellarless`; `SculptResult.cellar` dice la cantina tenuta, che il `ModelDirector` scrive nella voce). Il validatore prova un modello con la cantina come lo fa girare il mondo (`modelErrors` con `base`, `Validator.modelBase`). Le cose `under`: la casella le prende sul pavimento di un lotto la cui struttura ha la cantina (`cellarLots`), e `placeInside(…, under)` le posa sul pavimento della cantina (`cellarPoints`: le finestre di `INDOOR_REACH` dove ogni colonna è il pavimento sotto il suolo più comune, raggiunto dal piano terra, lontane 1,2 caselle dal piede della scala), con l'altezza (`pos.z`), altrimenti dentro. Offline `MockAiModels` chiede ogni tanto «la casa con la cantina» con una cassapanca giù (`CELLAR_CHANCE` 0,2, `CELLAR_HOUSE`, `CELLAR_THING`) e la villetta dello Scultore (`MOCK_STRUCTURE_PROGRAM`) segna `D` sotto il corpo, a 10 voxel dal muro davanti, e include `part-cellar`: passa a Grande, Enorme e Gargantuesca con la cantina di una casella; con due (le rare) la sua stanza è corta per la scala e la villetta entra senza. Diverso dal previsto: sei correzioni del kernel che le cantine dello Scultore e la prova nel browser hanno fatto vedere. (1) `rampBlocks` faceva aria di ogni colonna sopra la cantina più di un gradino lontana dai piedi, anche il pavimento del piano terra e la scala di sopra posati sulla cantina: ora è tromba solo la colonna vuota al livello del suolo (`solidAtGround`). (2) `formBlocks` faceva fermare chi sta in cantina ai mobili del piano terra sopra di lui: un modello tutto sopra la testa non ferma, come quello tutto sotto i piedi. (3) `floorAt` con l'altezza prendeva il pavimento più alto fra i modelli, anche il ripiano di un mobile sopra la testa: un pavimento più di un gradino sopra i piedi non è sotto di essi. (4) Il kernel e il renderer posavano ogni modello al suolo sotto il suo centro: una cosa in cantina sta ora alla sua altezza (`SolidForm.stand`, `cellarHeight`, `restsAt` per il renderer) e la sua altezza va ai client in un componente nuovo, `below: {z}`, fra le `ENTITY_PARTS` (lo specchio la tiene giù, `settleHeights`). (5) «Tutto sotto i piedi» guardava l'altezza della scatola del modello: ora quella dei suoi voxel (`topOf`). (6) `interiorPoints` contava la pedata più alta della cantina come pavimento del piano terra: ora le cose del piano terra stanno a tre quarti di casella dalla tromba, e quelle della cantina a 1,2 caselle dal piede della scala e a tre quarti dai suoi fianchi. Verificato nel browser (`docs/design/sotterranei-stato.md` § 9): si scende e si risale senza un passo bloccato, la cassapanca si vede in cantina. La scala della cantina non è quella di `part-stair` (due su per uno avanti): sopra la cantina il corpo vuole un pavimento entro un gradino su ogni colonna che copre, quindi pedate più lunghe del corpo; per due caselle di cantina serve una stanza di più di 70 voxel. Solo le strutture che crescono a regole hanno la cantina; un edificio e una struttura sotto Grande no. T411 la chiede passando `cellar` della voce nella richiesta.
- **T420** (kernel 0.9.7): le cantine di T417 accanto alla casa che usa la Grande (T413, ADR-0213): i controlli dello Scultore vogliono insieme l'abitazione e la cantina (`CheckOptions`: `dwelling`, `cellar`); il pavimento di un'abitazione (`storeyFloors`, `dwellingErrors`) non conta la cantina, come `reachableStoreys`; la villetta offline segna la cantina anche sotto il muro interno (una cantina sola sotto le due stanze) e ha il corpo più largo, perché il buco della scala non la porti sotto le 10 caselle² a terra.

## Conseguenze
- Il mondo resta uno: una cantina sta davvero sotto la sua casa, la si vede scendere e il terreno attorno ha i suoi strati.
- Il kernel non scava: il terreno sotto il suolo non si modifica (niente «Altro…» che scava gallerie; con il motore dell'acqua di
  T51b e gli incantesimi di T57 se ne riparlerà). Gli strati sono solo aspetto: non bloccano nulla, perché nessun corpo arriva fuori
  da un modello sotto il suolo.
- Il salto (ADR-0080) non entra nelle cantine dall'alto né le scavalca: chi sta sopra vede il suolo, non il buco, finché non scende.
- I luoghi sotterranei collegati tra loro (gallerie, catacombe tra più strutture) restano fuori: chiederebbero il terreno scavato e
  una connettività in 3D tra luoghi; si decideranno dopo le cantine.
- Costo: un campo in più nel piano (al più `6 × 18 × 18` caratteri per luogo), un programma in più per ambiente alla Genesi
  (qualche chiamata), nessuna chiamata in più per luogo.

## Alternative scartate
- **Un piano sotto il luogo come zona a parte** (come gli interni della corona): scartata dall'autore, uno spazio che non è sotto il
  mondo ne rompe la coerenza visiva.
- **Il taglio come piano di clipping nello shader** su tutto il terreno: mostra l'interno vuoto delle colonne e non gli strati; il
  taglio a caselle costa una mesh piccola e mostra ciò che il piano genera.
- **Strati a quarti di casella o in voxel**: costano memoria e mesh senza farsi vedere meglio dalla camera in 3/4.
