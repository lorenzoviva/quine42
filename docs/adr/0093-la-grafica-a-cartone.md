# ADR-0093 — La grafica a cartone

Data: 2026-10-31 · Stato: proposto (progetto del task T89; da attuare T89a-e) · Riferimenti: ADR-0037 (niente immagini generate),
ADR-0040 (il mondo in 3D), ADR-0041 (i modelli), ADR-0042 (lo Scultore), ADR-0046 (i voxel luminosi)

## Contesto
L'autore (to-do del 29/10, «Grafica a cartone») vuole che l'universo abbia l'aspetto di *Stompworks*, un gioco fatto con Claude
Code visto su Reddit; la foto è in `docs/archivio/3-to-do-backlog/userchats/grafica_cartone.png`. Oggi il mondo è vertex color con
`MeshLambertMaterial`, ombre morbide PCF, nebbia lontana e un bloom solo sui voxel luminosi: pulito ma «da voxel», senza disegno.

### Che cosa fa quell'aspetto (dalla foto)
1. **Contorni a inchiostro**: una linea scura di 1,5-2 px attorno a ogni sagoma e lungo i confini tra le parti (le gambe del mech,
   le casse, i tetti, le rocce); **non** su ogni faccetta. L'inchiostro non è nero: è il colore della cosa molto scurito, blu-bruno.
   Alcune linee sono *disegnate* sulle superfici (le assi delle casse, i pannelli, le crepe nelle rocce): dettaglio come segno, non
   come geometria.
2. **Ombreggiatura a fasce**: due o tre toni piatti per superficie (luce, mezzaluce, ombra), passaggi netti, niente speculare; il lato
   in ombra resta saturo e un po' freddo, mai grigio.
3. **Palette**: ambiente smorzato e chiaro (rocce beige-grigie, neve bianca con ombre azzurre, abeti verde scuro), accenti saturi e
   pochi sulle cose che contano (arancio e giallo su blu notte, viola, il telo azzurro). Colori pieni, uno per parte.
4. **Luce e atmosfera**: luce calda dall'alto, riempimento freddo dal cielo, ombre portate corte e tinte d'azzurro; prospettiva
   aerea forte: ciò che è lontano sbiadisce verso l'azzurro del cielo (le montagne sono sagome chiare).
5. **Proporzioni**: forme tozze e semplificate, leggibili da lontano, tante piccole cose sparse (casse, cartelli, coni, staccionate)
   che danno ricchezza senza dettaglio fine.

Gran parte c'è già nello stile di QUINE42 (forme tozze, pochi colori per modello, tante cose nei luoghi); mancano contorni, fasce,
la luce tinta e la prospettiva aerea.

### La prova (T89, `?cartone`)
`src/render/cartoon.ts`, acceso solo con `?cartone` nell'URL: i materiali illuminati della simulazione (`MAT.world sway cut glass
cutGlass`) diventano `MeshToonMaterial` con una mappa a tre fasce (lo stesso `clipped()`: i pezzi di shader che tocca ci sono anche nel
toon), e un passo dell'`EffectComposer` (`Ink`, prima del bloom) scurisce dove profondità o normale saltano, leggendo normali e
profondità da un secondo disegno della scena (`overrideMaterial` normali, target con `DepthTexture`). Le soglie sono in console
(`window.cartone`). Esiti, confrontati con la foto:
- **Fasce**: funzionano senza toccare altro; sul terreno piano cambiano poco (tutte le caselle hanno la stessa normale), sulle case e
  sugli alberi danno il passaggio netto luce/ombra.
- **Contorni da profondità e normali**: belli sui gradini del rilievo, sui bordi dei sentieri e sulle case (il tratto della foto); sugli
  **alberi**, modelli fitti di voxel (20 per casella), ogni voxel fa il suo bordo e la chioma diventa un rumore nero. Solo la profondità
  con una soglia alta toglie il rumore ma anche le sagome. Quindi il bordo non si può prendere dalla geometria dei voxel.

## Decisione
1. **Il mondo si disegna a cartone**, sempre senza immagini generate (regola 11): tutto è shader e dati dei programmi MarkovJunior.
   È un aspetto del client (il renderer), non un dato dell'universo; quando T89a-c sono fatti diventa il predefinito e `?classica`
   mostra quello di prima per confronto.
2. **Fasce**: `MeshToonMaterial` (o il Lambert con la diffusa quantizzata, se il toon costa) con una rampa di 3 fasce, per la
   simulazione, la corona e lo studio; i voxel luminosi restano emissivi e fuori dalle fasce; le ombre portate restano (PCF) ma con
   il bordo più netto e tinte del colore del cielo.
3. **Contorni dagli identificatori, non dalla geometria**: un disegno a parte (o un secondo bersaglio dello stesso disegno, MRT) scrive
   per ogni pixel l'**id della cosa** (mesh o istanza) e l'**id della parte** (la lettera della palette del programma MarkovJunior, o la
   `<color part>`; per il terreno il codice della casella), con la profondità. L'inchiostro va dove cambia la cosa, dove cambia la parte
   o dove la profondità salta molto (gradini del rilievo, sagome contro lo sfondo); mai tra due voxel della stessa parte. Spessore
   costante in pixel (per `devicePixelRatio`), colore del pixel scurito (≈ 0,18 × colore + un fondo blu-bruno), niente inchiostro sui voxel
   luminosi. `src/mj/mesh.ts` porta la parte in un attributo per vertice (`part`), come `glow` e `sway`.
4. **Luce e atmosfera**: luce chiave calda, riempimento emisferico freddo, ombra tinta; la nebbia diventa prospettiva aerea (verso il
   colore del cielo, più presto e più forte), giorno e notte compresi.
5. **Lo stile si scrive nei dati**: la guida di stile del seme (`world/style.md`) e i prompt di Artista e Scultore chiedono ciò che i
   contorni sanno disegnare: un colore pieno per parte, contrasto di valore tra parti vicine (il bordo nasce lì), dettagli come lettere
   scure dedicate (assi, pannelli, crepe: il «segno») invece di micro-voxel, forme tozze, ambiente smorzato e pochi accenti saturi.
   Le foto dei modelli (`src/mj/photo.ts`, icone) si fanno con lo stesso aspetto, così l'Artista giudica ciò che si vede.
6. La prova `?cartone` resta nel codice come base di T89a e si toglie quando il cartone è il predefinito.

## Conseguenze
- Un disegno in più per fotogramma (id, parte, profondità) finché non c'è l'MRT: va misurato (T89e) sul portatile dell'autore.
- I modelli scritti finora hanno palette pensate per il Lambert: con il cartone le parti con colori quasi uguali non avranno bordo;
  l'Artista li segnalerà nel giudizio (`riscolpisci`), senza rifare la libreria in blocco.
- L'aspetto non cambia lo stato del mondo né i test del kernel; i test nuovi sono su `mesh.ts` (l'attributo `part`) e sulle funzioni pure
  del passo dell'inchiostro, il resto si verifica nel browser.

## Task
T89a (fasce e interruttore), T89b (contorni dagli id), T89c (luce e prospettiva aerea), T89d (stile nei dati e foto dei modelli),
T89e (corona, studio, laboratorio e misura delle prestazioni). Dettagli nel backlog.

## Attuazione
T89a (punti 1, 2 e 6, ancora dietro `?cartone`): la rampa non ha soglie uguali, perché con sei normali e questo sole tre terzi darebbero due fasce sole; l'ombra
portata lascia passare la fascia bassa, perché le facce lontane dal sole sono anche in ombra; nello studio c'è un sole tenue, perché senza luce diretta le fasce non
esistono. Numeri e nomi in `docs/architettura-dettagli.md#cartone`. Le ombre tinte restano a T89c, come la luce calda e la prospettiva aerea.

T89c (punto 4, ancora dietro `?cartone`): la notte ha una luna al posto del sole, perché senza luce diretta le fasce sparirebbero; l'ombra si tinge moltiplicando la luce
raccolta, senza leggere due volte la mappa delle ombre (il sole è l'ultima luce che three.js attraversa); non è proprio il colore del cielo, perché al tramonto darebbe ombre
arancioni e la foto le vuole fredde: è un azzurro, viola al tramonto. La nebbia si misura sulla distanza della camera e diventa tutto cielo prima della fine di ciò che è
caricato, così anche la camera libera bassa sull'orizzonte non vede il bordo del mondo. Anche l'inchiostro sbiadisce con la nebbia. Numeri in `docs/architettura-dettagli.md#cartone`.

T89b (punto 3, ancora dietro `?cartone`): un secondo disegno e non l'MRT, che avrebbe chiesto di cambiare ogni materiale della scena, e senza rifare la mappa delle ombre. **Una correzione al punto 3**: la parte non è la lettera della
palette. Il pino del seme ha tre verdi sparsi a caso sulla chioma e una riga lungo ciascuno sarebbe di nuovo il rumore; quindi le lettere che sono sfumature di un colore (stessa tinta, luminosità vicina, anche per il tramite di una terza)
sono una parte sola (`partTable` in `src/mj/mesh.ts`), mentre una `<color part>` resta una parte qualunque sia il colore. La regola guarda solo la palette, così non dipende dal seme. Una conseguenza per T89d: chi vuole una riga tra due parti della stessa tinta deve staccarle di
luminosità. Il terreno ha una parte per il piano e una per le facce laterali, perché un gradino visto di fronte non ha salti di profondità. Il cartone non è ancora il predefinito: lo mette T89e. Numeri in `docs/architettura-dettagli.md#cartone`.
