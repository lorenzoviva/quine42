# ADR-0091 — I sotterranei

Data: 2026-10-30 · Stato: accettato, da attuare (progetto di T52a; codice in T52b, T52c, T52d, T52e, T52f) · Riferimenti: Regola 10,
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
